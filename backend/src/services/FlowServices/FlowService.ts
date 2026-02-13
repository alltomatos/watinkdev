import Flow from "../../models/Flow";
import AppError from "../../errors/AppError";
import FlowTrigger from "../../models/FlowTrigger";
import { Op } from "sequelize";

interface Request {
    name: string;
    nodes: object[];
    edges: object[];
    tenantId: string | number;
    userId: number;
    whatsappId?: number;
}

const MESSAGE_NODE_TYPES = new Set(["message", "menu", "default", "textupdater"]);

const hasOutboundMessageNodes = (nodes: any[] = []): boolean => {
    return nodes.some((node: any) => MESSAGE_NODE_TYPES.has(String(node?.type || "").toLowerCase()));
};

const CreateFlowService = async ({
    name,
    nodes,
    edges,
    tenantId,
    userId,
    whatsappId
}: Request): Promise<Flow> => {
    // Check if whatsappId is already in use
    if (whatsappId) {
        const flowExists = await Flow.findOne({
            where: {
                whatsappId,
                tenantId,
                isActive: true
            }
        });

        if (flowExists) {
            throw new AppError("This connection is already bound to another flow.", 409);
        }
    }

    const flow = await Flow.create({
        name,
        nodes,
        edges,
        tenantId,
        userId,
        whatsappId
    });

    return flow;
};

const ListFlowsService = async ({ tenantId }: { tenantId: string | number }): Promise<Flow[]> => {
    const flows = await Flow.findAll({
        where: { tenantId },
        order: [["updatedAt", "DESC"]],
        include: ["whatsapp"] // Eager load connection info
    });
    return flows;
};

const UpdateFlowService = async ({
    id,
    flowData,
    tenantId
}: {
    id: number;
    flowData: Partial<Request>;
    tenantId: string | number;
}): Promise<Flow> => {
    const flow = await Flow.findOne({
        where: { id, tenantId }
    });

    if (!flow) {
        throw new AppError("Flow not found", 404);
    }

    const nextNodes = Array.isArray(flowData.nodes) ? (flowData.nodes as any[]) : (Array.isArray(flow.nodes) ? (flow.nodes as any[]) : []);
    const nextWhatsappId = flowData.whatsappId !== undefined ? flowData.whatsappId : flow.whatsappId;

    // Backend guard: fluxo ativo com nós de envio exige conexão vinculada mesmo em updates diretos via API
    if (flow.isActive && hasOutboundMessageNodes(nextNodes) && !nextWhatsappId) {
        throw new AppError(
            "Este fluxo possui nós de envio de mensagem. Vincule uma conexão WhatsApp antes de salvar.",
            400
        );
    }

    // Check if whatsappId is already in use (excluding current flow)
    if (nextWhatsappId) {
        const flowExists = await Flow.findOne({
            where: {
                whatsappId: nextWhatsappId,
                tenantId,
                isActive: true,
                id: { [Op.ne]: id }
            }
        });

        if (flowExists) {
            throw new AppError("This connection is already bound to another flow.", 409);
        }
    }

    await flow.update(flowData);

    // Sync Triggers based on Start Node
    if (flowData.nodes) {
        const startNode = (flowData.nodes as any[]).find((n: any) => n.type === "input");
        if (startNode && startNode.data && startNode.data.trigger) {
            const { type, condition } = startNode.data.trigger;

            // Upsert Trigger
            const existingTrigger = await FlowTrigger.findOne({ where: { flowId: id } });
            if (existingTrigger) {
                await existingTrigger.update({ type, condition, isActive: true });
            } else {
                await FlowTrigger.create({
                    flowId: id,
                    type,
                    condition,
                    tenantId,
                    isActive: true
                });
            }
        }
    }

    return flow;
};

const ShowFlowService = async ({ id, tenantId }: { id: number; tenantId: string | number }): Promise<Flow> => {
    const flow = await Flow.findOne({
        where: { id, tenantId },
        include: ["whatsapp"]
    });

    if (!flow) {
        throw new AppError("Flow not found", 404);
    }

    return flow;
};

const ToggleFlowService = async ({ id, tenantId }: { id: number; tenantId: string | number }): Promise<Flow> => {
    const flow = await Flow.findOne({
        where: { id, tenantId }
    });

    if (!flow) {
        throw new AppError("Flow not found", 404);
    }

    // Toggle isActive
    const newStatus = !flow.isActive;

    // Se ativando e o fluxo tiver nós de envio, conexão WhatsApp é obrigatória
    if (newStatus) {
        const flowNodes = Array.isArray(flow.nodes) ? (flow.nodes as any[]) : [];
        const requiresConnection = hasOutboundMessageNodes(flowNodes);

        if (requiresConnection && !flow.whatsappId) {
            throw new AppError(
                "Este fluxo possui nós de envio de mensagem. Vincule uma conexão WhatsApp antes de ativar.",
                400
            );
        }
    }

    // Se ativando, verificar se whatsappId já está em uso por outro fluxo ativo
    if (newStatus && flow.whatsappId) {
        const conflictFlow = await Flow.findOne({
            where: {
                whatsappId: flow.whatsappId,
                tenantId,
                isActive: true,
                id: { [Op.ne]: id }
            }
        });

        if (conflictFlow) {
            throw new AppError(`Esta conexão já está vinculada ao fluxo "${conflictFlow.name}". Desative-o primeiro.`, 409);
        }
    }

    await flow.update({ isActive: newStatus });

    return flow;
};

export { CreateFlowService, ListFlowsService, UpdateFlowService, ShowFlowService, ToggleFlowService };


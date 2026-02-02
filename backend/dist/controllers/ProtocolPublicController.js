"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.show = void 0;
const Protocol_1 = __importDefault(require("../models/Protocol"));
const ProtocolHistory_1 = __importDefault(require("../models/ProtocolHistory"));
const ProtocolAttachment_1 = __importDefault(require("../models/ProtocolAttachment"));
const User_1 = __importDefault(require("../models/User"));
const Tenant_1 = __importDefault(require("../models/Tenant"));
const Setting_1 = __importDefault(require("../models/Setting"));
const AppError_1 = __importDefault(require("../errors/AppError"));
const show = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.params;
    const protocol = yield Protocol_1.default.findOne({
        where: { token },
        include: [
            {
                model: Tenant_1.default,
                as: "tenant",
                attributes: ["name"]
            },
            {
                model: ProtocolAttachment_1.default,
                as: "attachments",
                attributes: ["id", "fileName", "originalName", "fileType", "fileSize", "filePath", "createdAt"]
            },
            {
                model: ProtocolHistory_1.default,
                as: "history",
                include: [
                    {
                        model: User_1.default,
                        as: "user",
                        attributes: ["name"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            }
        ],
        attributes: [
            "id",
            "protocolNumber",
            "subject",
            "description",
            "status",
            "priority",
            "createdAt",
            "resolvedAt",
            "closedAt",
            "tenantId"
        ]
    });
    if (!protocol) {
        throw new AppError_1.default("Protocol not found", 404);
    }
    const systemTitle = yield Setting_1.default.findOne({
        where: { key: "systemTitle", tenantId: protocol.tenantId }
    });
    const systemLogo = yield Setting_1.default.findOne({
        where: { key: "systemLogo", tenantId: protocol.tenantId }
    });
    const response = Object.assign(Object.assign({}, protocol.toJSON()), { tenantConfig: {
            systemTitle: systemTitle === null || systemTitle === void 0 ? void 0 : systemTitle.value,
            systemLogo: systemLogo === null || systemLogo === void 0 ? void 0 : systemLogo.value
        } });
    return res.json(response);
});
exports.show = show;

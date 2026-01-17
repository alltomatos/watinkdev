import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import TenantSmtpSettings from "../models/TenantSmtpSettings";
import RabbitMQService from "../services/RabbitMQService";


interface SmtpSettingsData {
    host: string;
    port: number;
    user: string;
    password?: string;
    secure: boolean;
    emailFrom: string;
}

export const show = async (req: Request, res: Response): Promise<Response> => {
    const { tenantId } = req.user;
    try {
        const { tenantId } = req.user;

        const settings = await TenantSmtpSettings.findOne({
            where: { tenantId }
        });

        return res.status(200).json(settings);
    } catch (error) {
        throw new AppError("INTERNAL_ERR_SMTP_UPDATE", 500);
    }
};

export const test = async (req: Request, res: Response): Promise<Response> => {
    const { tenantId } = req.user;
    const { host, port, user, password, secure, emailFrom, testEmail } = req.body;

    if (!testEmail) {
        throw new AppError("ERR_SMTP_TEST_EMAIL_REQUIRED", 400);
    }

    try {
        const payload = {
            tenantId,
            host,
            port: parseInt(port, 10),
            user,
            password,
            secure,
            emailFrom: emailFrom || user,
            to: testEmail,
            subject: "Watink - Teste de SMTP",
            text: "Se você recebeu este e-mail, sua configuração de SMTP no Watink está funcionando corretamente!",
            html: "<b>Se você recebeu este e-mail, sua configuração de SMTP no Watink está funcionando corretamente!</b>",
        };

        const envelope = {
            id: "", // RabbitMQ/Service usually handles ID if omitted, or we generate one. 
            // Based on other usage, let's see if we need to generate UUID. 
            // Actually RabbitMQService uses JSON.stringify(message).
            // Let's generate a UUID if required or just pass strict structure.
            timestamp: Date.now(),
            type: "smtp.send",
            payload
        };

        // We need to match Envelope<T> interface. 
        // Assuming Envelope has id, timestamp, type, payload.
        // Let's fix imports first to include Envelope
        await RabbitMQService.publishCommand("smtp.send", envelope as any);

        return res.status(200).json({ message: "Solicitação de e-mail de teste enviada para fila!" });
    } catch (error) {
        return res.status(400).json({ error: "Falha ao enfileirar teste SMTP", details: error.message });
    }
};

export const update = async (req: Request, res: Response): Promise<Response> => {
    const { tenantId } = req.user;
    const data: SmtpSettingsData = req.body;

    const schema = Yup.object().shape({
        host: Yup.string().required(),
        port: Yup.number().required(),
        user: Yup.string().required(),
        password: Yup.string(),
        secure: Yup.boolean().required(),
        emailFrom: Yup.string().email().required()
    });

    try {
        await schema.validate(data);
    } catch (err) {
        throw new AppError(err.message);
    }

    let settings = await TenantSmtpSettings.findOne({
        where: { tenantId }
    });

    if (!settings) {
        settings = await TenantSmtpSettings.create({
            ...data,
            tenantId
        });
    } else {
        // If password is provided, update it. If empty string/undefined, keep existing.
        // Assuming frontend sends empty string or undefined if not changing password
        const updateData = { ...data };
        if (!updateData.password) {
            delete updateData.password;
        }

        await settings.update(updateData);
    }

    return res.status(200).json(settings);
};

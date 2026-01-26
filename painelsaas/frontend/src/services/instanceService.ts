import axios from 'axios';

export interface Instance {
    id: string;
    name: string;
    url: string;
    api_key: string;
    push_enabled: boolean;
    status: string;
}

export interface CreateInstanceData {
    name: string;
    url: string;
}

export interface CreateInstanceResponse {
    id: string;
    api_key: string;
    message: string;
}

export const instanceService = {
    getInstances: async (): Promise<Instance[]> => {
        const response = await axios.get<Instance[]>('/api/v1/instances');
        return response.data;
    },

    createInstance: async (data: CreateInstanceData): Promise<CreateInstanceResponse> => {
        const response = await axios.post<CreateInstanceResponse>('/api/v1/instances', data);
        return response.data;
    },

    togglePush: async (id: string): Promise<{ push_enabled: boolean }> => {
        const response = await axios.post<{ push_enabled: boolean }>(`/api/v1/instances/${id}/toggle`);
        return response.data;
    }
};

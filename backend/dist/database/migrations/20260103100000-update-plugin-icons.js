"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    up: async (queryInterface) => {
        await queryInterface.bulkUpdate("Plugins", { iconUrl: "/assets/plugins/clientes/icon.png" }, { slug: "clientes" });
        await queryInterface.bulkUpdate("Plugins", { iconUrl: "/assets/plugins/helpdesk/icon.png" }, { slug: "helpdesk" });
    },
    down: async (queryInterface) => {
        await queryInterface.bulkUpdate("Plugins", { iconUrl: "https://plugins.watink.com/clientes/icon.png" }, { slug: "clientes" });
        await queryInterface.bulkUpdate("Plugins", { iconUrl: "https://plugins.watink.com/helpdesk/icon.png" }, { slug: "helpdesk" });
    }
};

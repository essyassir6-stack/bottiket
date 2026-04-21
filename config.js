module.exports = {
  token: process.env.TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  panelChannelId: process.env.PANEL_CHANNEL_ID,
  ticketCategoryId: process.env.TICKET_CATEGORY_ID,
  logChannelId: process.env.LOG_CHANNEL_ID,

  staffRoles: process.env.STAFF_ROLES?.split(',') || [],

  bannerImage: process.env.BANNER_IMAGE,

  colors: {
    primary: 0xff0000,
    secondary: 0x8b0000,
    success: 0x00ff00,
    error: 0xff4444,
    info: 0x2b2d31
  },

  categories: [
    {
      id: 'support',
      name: '📋 Support',
      emoji: '🎫',
      description: 'General support',
      color: 0x3498db
    }
  ],

  ticketSettings: {
    maxTicketsPerUser: 3,
    autoCloseDays: 3,
    deleteAfterClose: false
  }
};
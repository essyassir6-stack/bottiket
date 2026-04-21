const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, Partials } = require('discord.js');
const config = require('./config');

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel]
});

// Store active tickets
const activeTickets = new Map();

// ========================================
// CREATE TICKET PANEL EMBED
// ========================================

function createTicketPanel() {
  const embed = new EmbedBuilder()
    .setTitle('🎫 SUPPORT TICKET SYSTEM')
    .setDescription('> Welcome to our premium support system\n> Select a category below to create a ticket')
    .setColor(config.colors.primary)
    .setImage(config.bannerImage)
    .setThumbnail('https://cdn.discordapp.com/attachments/1462437612647088335/1482006389843824670/content.png')
    .addFields(
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━',
        value: '```diff\n+ HOW IT WORKS\n```',
        inline: false
      },
      {
        name: '📌 Step 1',
        value: 'Choose a category from the buttons below',
        inline: true
      },
      {
        name: '📌 Step 2',
        value: 'Fill out the ticket information form',
        inline: true
      },
      {
        name: '📌 Step 3',
        value: 'Wait for staff to assist you',
        inline: true
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━',
        value: '```diff\n- RULES & GUIDELINES\n```',
        inline: false
      },
      {
        name: '📋 Rule 1',
        value: 'Be respectful to staff members',
        inline: true
      },
      {
        name: '📋 Rule 2',
        value: 'Do not create multiple tickets',
        inline: true
      },
      {
        name: '📋 Rule 3',
        value: 'Provide detailed information',
        inline: true
      },
      {
        name: '━━━━━━━━━━━━━━━━━━━━━━',
        value: '```fix\n⚙️ SYSTEM INFORMATION\n```',
        inline: false
      },
      {
        name: '⏱️ Response Time',
        value: 'Usually within 15 minutes',
        inline: true
      },
      {
        name: '📊 Active Tickets',
        value: 'No limit per user',
        inline: true
      },
      {
        name: '🕐 Auto-Close',
        value: 'After 3 days of inactivity',
        inline: true
      }
    )
    .setFooter({ 
      text: 'PVP Gaming Support System • Premium Ticket Service', 
      iconURL: client.user?.displayAvatarURL() 
    })
    .setTimestamp();

  return embed;
}

// ========================================
// CREATE CATEGORY BUTTONS
// ========================================

function createCategoryButtons() {
  const rows = [];
  let currentRow = new ActionRowBuilder();
  let buttonCount = 0;

  for (const category of config.categories) {
    if (buttonCount === 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
      buttonCount = 0;
    }

    const button = new ButtonBuilder()
      .setCustomId(`ticket_${category.id}`)
      .setLabel(category.name)
      .setEmoji(category.emoji)
      .setStyle(ButtonStyle.Secondary);

    currentRow.addComponents(button);
    buttonCount++;
  }

  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}

// ========================================
// CREATE TICKET EMBED
// ========================================

function createTicketEmbed(category, user, reason) {
  const embed = new EmbedBuilder()
    .setTitle(`${category.emoji} ${category.name} Ticket`)
    .setDescription(`> Ticket created by ${user.toString()}\n> Category: **${category.name}**`)
    .setColor(category.color || config.colors.secondary)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      {
        name: '📋 Ticket Information',
        value: `\`\`\`yaml\nUser: ${user.tag}\nID: ${user.id}\nCategory: ${category.name}\nReason: ${reason}\nCreated: <t:${Math.floor(Date.now() / 1000)}:F>\`\`\``,
        inline: false
      },
      {
        name: '📌 Instructions',
        value: '• Please explain your issue in detail\n• Staff will assist you shortly\n• Do not ping staff members\n• Keep conversation professional',
        inline: false
      },
      {
        name: '⚙️ Quick Actions',
        value: 'Use the buttons below to manage this ticket',
        inline: false
      }
    )
    .setFooter({ 
      text: `Ticket ID: ${Date.now().toString(36)} • PVP Gaming Support`, 
      iconURL: client.user?.displayAvatarURL() 
    })
    .setTimestamp();

  return embed;
}

// ========================================
// CREATE TICKET BUTTONS
// ========================================

function createTicketButtons() {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('claim_ticket')
        .setLabel('Claim Ticket')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('transcript')
        .setLabel('Transcript')
        .setEmoji('📄')
        .setStyle(ButtonStyle.Secondary)
    );

  return row;
}

// ========================================
// CREATE TICKET MODAL
// ========================================

function createTicketModal(categoryId) {
  const modal = new ModalBuilder()
    .setCustomId(`ticket_modal_${categoryId}`)
    .setTitle(`Create ${config.categories.find(c => c.id === categoryId)?.name} Ticket`);

  const reasonInput = new TextInputBuilder()
    .setCustomId('ticket_reason')
    .setLabel('What is your issue about?')
    .setPlaceholder('Please provide a detailed description of your issue...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(1000);

  const priorityInput = new TextInputBuilder()
    .setCustomId('ticket_priority')
    .setLabel('Priority Level (Low/Medium/High/Urgent)')
    .setPlaceholder('Example: High')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
  const secondActionRow = new ActionRowBuilder().addComponents(priorityInput);
  modal.addComponents(firstActionRow, secondActionRow);

  return modal;
}

// ========================================
// CREATE TICKET CHANNEL
// ========================================

async function createTicketChannel(interaction, category) {
  const user = interaction.user;
  const categoryChannel = await interaction.guild.channels.fetch(config.ticketCategoryId);
  
  // Check existing tickets
  const existingTickets = activeTickets.get(user.id) || [];
  if (existingTickets.length >= config.ticketSettings.maxTicketsPerUser) {
    return interaction.reply({
      content: `❌ You already have ${config.ticketSettings.maxTicketsPerUser} active tickets! Please close existing tickets before creating new ones.`,
      ephemeral: true
    });
  }

  // Create ticket channel
  const channelName = `ticket-${category.id}-${user.username.toLowerCase()}-${Date.now().toString(36)}`;
  
  const ticketChannel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: categoryChannel,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles],
      },
      {
        id: client.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      }
    ]
  });

  // Add staff permissions
  for (const roleId of config.staffRoles) {
    await ticketChannel.permissionOverwrites.create(roleId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    });
  }

  // Store ticket info
  const ticketInfo = {
    channelId: ticketChannel.id,
    userId: user.id,
    category: category.id,
    createdAt: Date.now()
  };
  
  activeTickets.set(user.id, [...existingTickets, ticketInfo]);

  return ticketChannel;
}

// ========================================
// SEND TICKET MESSAGE
// ========================================

async function sendTicketMessage(channel, category, user, reason, priority) {
  const embed = createTicketEmbed(category, user, reason);
  const buttons = createTicketButtons();
  
  // Add priority to embed
  let priorityColor = 0x2ecc71;
  if (priority.toLowerCase() === 'high') priorityColor = 0xe67e22;
  if (priority.toLowerCase() === 'urgent') priorityColor = 0xe74c3c;
  
  embed.addFields({
    name: '⚠️ Priority Level',
    value: `\`\`\`css\n[ ${priority.toUpperCase()} ]\`\`\``,
    inline: true
  });
  
  embed.setColor(priorityColor);
  
  await channel.send({
    content: `<@${user.id}> ${config.staffRoles.map(r => `<@&${r}>`).join(' ')}`,
    embeds: [embed],
    components: [buttons]
  });
  
  // Send confirmation message
  await channel.send({
    content: `✅ Ticket created successfully! Staff will assist you shortly.`
  });
}

// ========================================
// CLOSE TICKET FUNCTION
// ========================================

async function closeTicket(interaction) {
  const channel = interaction.channel;
  const embed = new EmbedBuilder()
    .setTitle('🔒 Ticket Closing')
    .setDescription('This ticket will be closed in **5 seconds**...')
    .setColor(config.colors.error)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  setTimeout(async () => {
    // Get transcript
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcript = messages.reverse().map(m => {
      return `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`;
    }).join('\n');

    // Send to log channel
    const logChannel = await interaction.guild.channels.fetch(config.logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('📄 Ticket Transcript')
        .setDescription(`Ticket: ${channel.name}\nClosed by: ${interaction.user.tag}`)
        .setColor(config.colors.info)
        .setTimestamp();
      
      await logChannel.send({ embeds: [logEmbed] });
      
      // Send transcript as file
      const fs = require('fs');
      const fileName = `transcript-${channel.name}.txt`;
      fs.writeFileSync(fileName, transcript);
      await logChannel.send({ files: [fileName] });
      fs.unlinkSync(fileName);
    }

    // Remove from active tickets
    for (const [userId, tickets] of activeTickets) {
      const updatedTickets = tickets.filter(t => t.channelId !== channel.id);
      if (updatedTickets.length === 0) {
        activeTickets.delete(userId);
      } else {
        activeTickets.set(userId, updatedTickets);
      }
    }

    // Delete channel
    setTimeout(async () => {
      await channel.delete();
    }, 1000);
  }, 5000);
}

// ========================================
// CLAIM TICKET FUNCTION
// ========================================

async function claimTicket(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('✅ Ticket Claimed')
    .setDescription(`${interaction.user.toString()} has claimed this ticket and will assist you shortly.`)
    .setColor(config.colors.success)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  
  // Update channel name
  const channel = interaction.channel;
  const newName = channel.name.replace('ticket', 'claimed');
  await channel.setName(newName);
}

// ========================================
// DISCORD CLIENT EVENTS
// ========================================

client.once('ready', async () => {
  console.log('\n========================================');
  console.log('✅ PREMIUM TICKET BOT IS ONLINE');
  console.log('========================================');
  console.log(`🤖 Bot Name: ${client.user.tag}`);
  console.log(`📋 Categories: ${config.categories.length}`);
  console.log(`👥 Staff Roles: ${config.staffRoles.length}`);
  console.log('========================================\n');

  // Send ticket panel
  const panelChannel = await client.channels.fetch(config.panelChannelId);
  if (panelChannel) {
    const embed = createTicketPanel();
    const buttons = createCategoryButtons();
    
    // Check if panel already exists
    const messages = await panelChannel.messages.fetch({ limit: 10 });
    const existingPanel = messages.find(msg => 
      msg.author.id === client.user.id && 
      msg.embeds[0]?.title?.includes('SUPPORT TICKET SYSTEM')
    );
    
    if (!existingPanel) {
      await panelChannel.send({ embeds: [embed], components: buttons });
      console.log('✅ Ticket panel sent successfully');
    } else {
      console.log('📌 Ticket panel already exists');
    }
  }

  // Set bot status
  client.user.setPresence({
    activities: [{
      name: `${config.categories.length} Ticket Categories`,
      type: 3
    }],
    status: 'online'
  });
});

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  // Handle button interactions
  if (interaction.isButton()) {
    // Category buttons
    if (interaction.customId.startsWith('ticket_')) {
      const categoryId = interaction.customId.replace('ticket_', '');
      const category = config.categories.find(c => c.id === categoryId);
      
      if (!category) return;
      
      const modal = createTicketModal(categoryId);
      await interaction.showModal(modal);
    }
    
    // Ticket action buttons
    if (interaction.customId === 'close_ticket') {
      if (!interaction.member.roles.cache.some(r => config.staffRoles.includes(r.id)) && 
          interaction.channel.name.includes(interaction.user.username)) {
        await closeTicket(interaction);
      } else if (interaction.member.roles.cache.some(r => config.staffRoles.includes(r.id))) {
        await closeTicket(interaction);
      } else {
        await interaction.reply({ content: '❌ Only staff members or the ticket creator can close this ticket.', ephemeral: true });
      }
    }
    
    if (interaction.customId === 'claim_ticket') {
      if (!interaction.member.roles.cache.some(r => config.staffRoles.includes(r.id))) {
        return interaction.reply({ content: '❌ Only staff members can claim tickets.', ephemeral: true });
      }
      await claimTicket(interaction);
    }
    
    if (interaction.customId === 'transcript') {
      if (!interaction.member.roles.cache.some(r => config.staffRoles.includes(r.id))) {
        return interaction.reply({ content: '❌ Only staff members can request transcripts.', ephemeral: true });
      }
      
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse().map(m => {
        return `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`;
      }).join('\n');
      
      const fs = require('fs');
      const fileName = `transcript-${interaction.channel.name}.txt`;
      fs.writeFileSync(fileName, transcript);
      await interaction.reply({ files: [fileName], ephemeral: true });
      fs.unlinkSync(fileName);
    }
  }
  
  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('ticket_modal_')) {
      const categoryId = interaction.customId.replace('ticket_modal_', '');
      const category = config.categories.find(c => c.id === categoryId);
      const reason = interaction.fields.getTextInputValue('ticket_reason');
      const priority = interaction.fields.getTextInputValue('ticket_priority');
      
      await interaction.deferReply({ ephemeral: true });
      
      try {
        const ticketChannel = await createTicketChannel(interaction, category);
        await sendTicketMessage(ticketChannel, category, interaction.user, reason, priority);
        
        await interaction.editReply({
          content: `✅ Ticket created successfully! Please go to ${ticketChannel.toString()}`,
          ephemeral: true
        });
      } catch (error) {
        console.error(error);
        await interaction.editReply({
          content: '❌ Failed to create ticket. Please contact an administrator.',
          ephemeral: true
        });
      }
    }
  }
});

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Bot is shutting down...');
  client.destroy();
  process.exit(0);
});

// Login to Discord
client.login(config.token);
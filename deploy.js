const { PermissionFlagsBits } = require('discord.js');
const config = require('./config');

async function handleCommands(interaction) {
  if (!interaction.isChatInputCommand()) return;
  
  // /ticket command - send ticket panel
  if (interaction.commandName === 'ticket') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ You need administrator permissions to use this command.', ephemeral: true });
    }
    
    const embed = require('./index').createTicketPanel();
    const buttons = require('./index').createCategoryButtons();
    
    await interaction.channel.send({ embeds: [embed], components: buttons });
    await interaction.reply({ content: '✅ Ticket panel sent!', ephemeral: true });
  }
  
  // /adduser command - add user to ticket
  if (interaction.commandName === 'adduser') {
    const user = interaction.options.getUser('user');
    const channel = interaction.channel;
    
    if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('claimed-')) {
      return interaction.reply({ content: '❌ This command can only be used in ticket channels.', ephemeral: true });
    }
    
    await channel.permissionOverwrites.create(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    
    await interaction.reply({ content: `✅ Added ${user.toString()} to this ticket.`, ephemeral: true });
    await channel.send(`🔓 ${user.toString()} was added to this ticket by ${interaction.user.toString()}`);
  }
  
  // /removeuser command - remove user from ticket
  if (interaction.commandName === 'removeuser') {
    const user = interaction.options.getUser('user');
    const channel = interaction.channel;
    
    if (!channel.name.startsWith('ticket-') && !channel.name.startsWith('claimed-')) {
      return interaction.reply({ content: '❌ This command can only be used in ticket channels.', ephemeral: true });
    }
    
    await channel.permissionOverwrites.delete(user.id);
    await interaction.reply({ content: `✅ Removed ${user.toString()} from this ticket.`, ephemeral: true });
    await channel.send(`🔒 ${user.toString()} was removed from this ticket by ${interaction.user.toString()}`);
  }
}

module.exports = { handleCommands };
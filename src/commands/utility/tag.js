// src/commands/utility/tag.js
// Server tag system — create, get, delete, list, edit, search
'use strict';

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const supabase = require('../../config/supabase');

module.exports = {
  category: 'utility',
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Server tag system — create and use custom tags.')
    .addSubcommand(sub =>
      sub.setName('get')
        .setDescription('Retrieve a tag by name.')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true).setMaxLength(99))
    )
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new tag.')
        .addStringOption(o => o.setName('name').setDescription('Tag name (max 99 chars)').setRequired(true).setMaxLength(99))
        .addStringOption(o => o.setName('content').setDescription('Tag content').setRequired(true).setMaxLength(1990))
    )
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete a tag you own.')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true).setMaxLength(99))
    )
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Edit a tag you own.')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true).setMaxLength(99))
        .addStringOption(o => o.setName('content').setDescription('New content').setRequired(true).setMaxLength(1990))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all tags in this server.')
        .addUserOption(o => o.setName('user').setDescription('Filter by owner (optional)'))
    )
    .addSubcommand(sub =>
      sub.setName('search')
        .setDescription('Search for tags by name.')
        .addStringOption(o => o.setName('query').setDescription('Search query').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('info')
        .setDescription('Get info about a tag.')
        .addStringOption(o => o.setName('name').setDescription('Tag name').setRequired(true).setMaxLength(99))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    // ── GET ───────────────────────────────────────────────────────────────────
    if (sub === 'get') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const { data: tag } = await supabase.from('tags').select('*').eq('guild_id', guildId).ilike('name', name).single();

      if (!tag) return interaction.reply({ content: `❌ Tag \`${name}\` not found.`, ephemeral: true });

      // Increment usage
      await supabase.from('tags').update({ usage: (tag.usage || 0) + 1 }).eq('id', tag.id);

      await interaction.reply({ content: tag.content });

    // ── CREATE ────────────────────────────────────────────────────────────────
    } else if (sub === 'create') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const content = interaction.options.getString('content');

      const { data: existing } = await supabase.from('tags').select('id').eq('guild_id', guildId).ilike('name', name).single();

      if (existing) return interaction.reply({ content: `❌ A tag named \`${name}\` already exists.`, ephemeral: true });

      const { data: tag, error } = await supabase.from('tags').insert({
        guild_id: guildId,
        name,
        content,
        owner_id: interaction.user.id,
        usage: 0,
      }).select().single();

      if (error) {
        console.error('[tag create]', error);
        return interaction.reply({ content: '❌ Failed to create tag.', ephemeral: true });
      }

      await interaction.reply({ content: `✅ Tag \`${name}\` created! (ID: \`${tag.id}\`)`, ephemeral: true });

    // ── DELETE ────────────────────────────────────────────────────────────────
    } else if (sub === 'delete') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const { data: tag } = await supabase.from('tags').select('*').eq('guild_id', guildId).ilike('name', name).single();

      if (!tag) return interaction.reply({ content: `❌ Tag \`${name}\` not found.`, ephemeral: true });

      const canDelete = tag.owner_id === interaction.user.id || interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
      if (!canDelete) return interaction.reply({ content: '❌ This tag does not belong to you.', ephemeral: true });

      await supabase.from('tags').delete().eq('id', tag.id);
      await interaction.reply({ content: `✅ Tag \`${name}\` deleted.`, ephemeral: true });

    // ── EDIT ──────────────────────────────────────────────────────────────────
    } else if (sub === 'edit') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const content = interaction.options.getString('content');
      const { data: tag } = await supabase.from('tags').select('*').eq('guild_id', guildId).ilike('name', name).single();

      if (!tag) return interaction.reply({ content: `❌ Tag \`${name}\` not found.`, ephemeral: true });

      const canEdit = tag.owner_id === interaction.user.id || interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
      if (!canEdit) return interaction.reply({ content: '❌ This tag does not belong to you.', ephemeral: true });

      await supabase.from('tags').update({ content }).eq('id', tag.id);
      await interaction.reply({ content: `✅ Tag \`${name}\` updated.`, ephemeral: true });

    // ── LIST ──────────────────────────────────────────────────────────────────
    } else if (sub === 'list') {
      const user = interaction.options.getUser('user');

      let query = supabase.from('tags').select('*').eq('guild_id', guildId).order('usage', { ascending: false }).limit(25);
      if (user) query = query.eq('owner_id', user.id);

      const { data: tags } = await query;

      if (!tags?.length) return interaction.reply({ content: '📭 No tags found.', ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🏷️ Server Tags${user ? ` — ${user.username}` : ''}`)
        .setDescription(tags.map((t, i) => `\`${i + 1}.\` **${t.name}** — ${t.usage} uses`).join('\n'))
        .setFooter({ text: `Total: ${tags.length} tags` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    // ── SEARCH ────────────────────────────────────────────────────────────────
    } else if (sub === 'search') {
      const query = interaction.options.getString('query').toLowerCase();
      const { data: tags } = await supabase.from('tags').select('*').eq('guild_id', guildId).ilike('name', `%${query}%`).limit(10);

      if (!tags?.length) return interaction.reply({ content: `❌ No tags matching \`${query}\` found.`, ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🔍 Tags matching "${query}"`)
        .setDescription(tags.map((t, i) => `\`${i + 1}.\` **${t.name}** — ${t.usage} uses`).join('\n'))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    // ── INFO ──────────────────────────────────────────────────────────────────
    } else if (sub === 'info') {
      const name = interaction.options.getString('name').toLowerCase().trim();
      const { data: tag } = await supabase.from('tags').select('*').eq('guild_id', guildId).ilike('name', name).single();

      if (!tag) return interaction.reply({ content: `❌ Tag \`${name}\` not found.`, ephemeral: true });

      const owner = await interaction.client.users.fetch(tag.owner_id).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🏷️ Tag Info: ${tag.name}`)
        .addFields(
          { name: 'Owner', value: owner ? `${owner.tag}` : `Unknown (\`${tag.owner_id}\`)`, inline: true },
          { name: 'ID', value: `\`${tag.id}\``, inline: true },
          { name: 'Uses', value: `${tag.usage}`, inline: true },
          { name: 'Created', value: `<t:${Math.floor(new Date(tag.created_at).getTime() / 1000)}:R>`, inline: true },
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// src/commands/utility/birthday.js
'use strict';

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { supabase } = require('../../config/supabase');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('birthday')
    .setDescription('Register or view birthdays on the server')
    .addSubcommand(sub =>
      sub.setName('set')
        .setDescription('Register your birthday')
        .addIntegerOption(opt =>
          opt.setName('day')
            .setDescription('Day of the month (1-31)')
            .setMinValue(1)
            .setMaxValue(31)
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('month')
            .setDescription('Month of birth')
            .setRequired(true)
            .addChoices(
              { name: 'January', value: 1 }, { name: 'February', value: 2 },
              { name: 'March', value: 3 }, { name: 'April', value: 4 },
              { name: 'May', value: 5 }, { name: 'June', value: 6 },
              { name: 'July', value: 7 }, { name: 'August', value: 8 },
              { name: 'September', value: 9 }, { name: 'October', value: 10 },
              { name: 'November', value: 11 }, { name: 'December', value: 12 }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('View upcoming registered birthdays')
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const day = interaction.options.getInteger('day');
      const month = interaction.options.getInteger('month');

      await supabase.from('user_birthdays').upsert({
        guild_id: interaction.guild.id,
        user_id: interaction.user.id,
        birth_day: day,
        birth_month: month,
        updated_at: new Date().toISOString()
      }, { onConflict: 'guild_id,user_id' });

      return interaction.reply({
        content: `🎂 Your birthday has been set to **${day} ${MONTHS[month - 1]}**! Jarvis will celebrate your day with the server! 🎉`,
        ephemeral: true
      });
    }

    if (sub === 'list') {
      const { data: bdays } = await supabase
        .from('user_birthdays')
        .select('*')
        .eq('guild_id', interaction.guild.id)
        .order('birth_month', { ascending: true })
        .order('birth_day', { ascending: true })
        .limit(15);

      if (!bdays || bdays.length === 0) {
        return interaction.reply({ content: '📅 No birthdays registered yet. Use `/birthday set` to register yours!' });
      }

      const list = bdays.map(b => `🎂 <@${b.user_id}> — **${b.birth_day} ${MONTHS[b.birth_month - 1]}**`).join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xf472b6)
        .setTitle(`🎂 ${interaction.guild.name} — Registered Birthdays`)
        .setDescription(list)
        .setFooter({ text: 'Jarvis Birthdays • Made by trj7' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const { token, roleId, logChannelId, rulesChannelId, rulesMenu, ownerId } = require('./config.json');
const rules = require('./rules.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.login(token).then(() => {
  console.log(`Logged in as ${client.user.tag}!`);
}).catch(console.error);

// أمر !قوانين
client.on('messageCreate', async message => {
  if (message.content === '!قوانين' && message.guild) {
    if (message.author.bot) return;

    if (message.author.id !== ownerId) {
      return message.reply('ليس لديك الصلاحية لاستخدام هذا الأمر!');
    }

    const rulesChannel = message.guild.channels.cache.get(rulesChannelId);
    if (!rulesChannel) {
      return message.reply('لم يتم العثور على القناة المحددة لعرض القوانين.');
    }

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('التزام بالقوانين')
      .setThumbnail('https://cdn3.emoji.gg/emojis/86494-readrules-ids.png')
      .setImage('https://i.imgur.com/i7ymNuJ.png')
      .setFooter({
        text: 'يرجى قراءة القوانين والموافقة عليها بالضغط على الزر أدناه.',
        iconURL: 'https://cdn3.emoji.gg/emojis/2391_rules.png'
      })
      .setTimestamp();

    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('agree')
          .setLabel('موافق على القوانين')
          .setStyle(ButtonStyle.Success)
      );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('rules_select')
      .setPlaceholder('اختر نوع القوانين لعرضها');

    rulesMenu.forEach((rule) => {
      selectMenu.addOptions({
        label: rule.label,
        emoji: rule.emoji,
        value: rule.value // تعديل مهم
      });
    });

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await rulesChannel.send({
      embeds: [embed],
      components: [button, row]
    });

    const replyMsg = await message.reply('تم إرسال القوانين في القناة المحددة.');
    setTimeout(() => {
      replyMsg.delete().catch(() => {});
    }, 60000); // حذف بعد 60 ثانية
  }
});

// الضغط على زر الموافقة
client.on('interactionCreate', async interaction => {
  if (interaction.isButton() && interaction.customId === 'agree') {
    const member = interaction.member;
    const role = interaction.guild.roles.cache.get(roleId);

    if (!role) {
      return await interaction.reply({ content: 'لم يتم العثور على الرتبة المحددة.', ephemeral: true });
    }

    if (member.roles.cache.has(role.id)) {
      const alreadyHasRoleEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('أنت بالفعل موافق على القوانين!')
        .setDescription('لقد قمت بالموافقة على القوانين من قبل. شكراً لك!')
        .setThumbnail('https://cdn3.emoji.gg/emojis/86494-readrules-ids.png')
        .setImage('https://i.imgur.com/i7ymNuJ.png')
        .setFooter({ text: 'تأكد من الالتزام بالقوانين', iconURL: 'https://cdn3.emoji.gg/emojis/2391_rules.png' })
        .setTimestamp();

      return await interaction.reply({ embeds: [alreadyHasRoleEmbed], ephemeral: true });
    }

    try {
      await member.roles.add(role);

      const successEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('تم الموافقة على القوانين')
        .setDescription('شكراً لموافقتك على القوانين!')
        .setThumbnail('https://cdn3.emoji.gg/emojis/86494-readrules-ids.png')
        .setImage('https://i.imgur.com/i7ymNuJ.png')
        .setFooter({ text: 'تأكد من الالتزام بالقوانين', iconURL: 'https://cdn3.emoji.gg/emojis/2391_rules.png' })
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });

      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('عضو وافق على القوانين')
          .addFields(
            { name: 'العضو:', value: member.toString(), inline: true },
            { name: 'ID:', value: member.id, inline: true }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } else {
        console.error('لم يتم العثور على قناة اللوج المحددة.');
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'حدث خطأ أثناء إضافة الرتبة. يرجى المحاولة مرة أخرى.', ephemeral: true });
    }

  } else if (interaction.isStringSelectMenu() && interaction.customId === 'rules_select') {
    const selectedRule = interaction.values[0];
    const ruleText = rules[selectedRule];

    await interaction.deferUpdate();

    if (ruleText) {
      const ruleEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('قوانين مختارة')
        .setDescription(ruleText)
        .setFooter({ text: 'تأكد من الالتزام بالقوانين', iconURL: 'https://cdn3.emoji.gg/emojis/2391_rules.png' })
        .setThumbnail('https://cdn3.emoji.gg/emojis/86494-readrules-ids.png')
        .setImage('https://i.imgur.com/i7ymNuJ.png')
        .setTimestamp();

      await interaction.followUp({ embeds: [ruleEmbed], ephemeral: true });
    } else {
      await interaction.followUp({ content: 'لم يتم العثور على القوانين المطلوبة.', ephemeral: true });
    }
  }
});

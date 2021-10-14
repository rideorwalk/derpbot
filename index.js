require('dotenv').config({ path: 'config/.env' })

const fs = require('fs')
const { Client, Intents } = require('discord.js')

const intents = new Intents()
intents.add(Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES)

const client = new Client({ intents: intents })

const DERP_CHAIN_CONFIG_PATH = "config/derpChain.json"
const MIN_CHAIN_TO_START = 5
const INIT_DERP_CHAIN = {
    started: false,
    total: 0,
    startedBy: "",
    ruinedBy: ""
}

let derpChain = {}
let derpChainRecord = -1

const reset = () => {
    derpChain = { ...INIT_DERP_CHAIN }
}

const getDerpChainRecord = () => {
    try
    {
        const derpChainConfig = JSON.parse(fs.readFileSync(DERP_CHAIN_CONFIG_PATH))
        return derpChainConfig["record"] || MIN_CHAIN_TO_START
    }
    catch (err) {
        console.error("Could not load the derp chain record!", err)
        return MIN_CHAIN_TO_START
    }
}

const updateDerpChainRecord = () => {
    const newRecord = derpChain.total

    const data = { record: newRecord }

    try
    {
        fs.writeFileSync(DERP_CHAIN_CONFIG_PATH, JSON.stringify(data))
    }
    catch (err)
    {
        console.error("Could not update the derp chain record!", err)
    }
}

const onDerpChainEnded = (message) => {
    derpChain.ruinedBy = message.author.id

    // If the record was broken
    if (derpChain.total > derpChainRecord) {        
        message.channel.send(`
            :derp: The Derp Chain just ended! 🚂
            🎉 Congratz! The record was broken! 🎉
            Previous Record: ${derpChainRecord} New Record: ${derpChain.total}
            Started By: <@${derpChain.startedBy}>
            Ruined By:<@${derpChain.ruinedBy}>
        `.replace(/  +/g, ''))

        // Store the new record
        updateDerpChainRecord()
    }
    // If the record wasn't broken
    else
    {
        message.channel.send(`
            :derp: The Derp Chain just ended! 🚂
            The current record is: ${derpChainRecord} but y'all only reached: ${derpChain.total} 😩 Better luck next time!
            Started By: <@${derpChain.startedBy}>
            Ruined By:<@${derpChain.ruinedBy}>
        `.replace(/  +/g, ''))
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`)
    
    derpChain = { ...INIT_DERP_CHAIN }
    derpChainRecord = getDerpChainRecord()
})

client.on('messageCreate', async message => {
    if (message.content?.toLowerCase() !== "derp")
    {
        if(derpChain.started)
            onDerpChainEnded(message)

        reset()
        return
    }

    // Keep track of who started the chain
    if (derpChain.total === 0)
        derpChain.startedBy = message.author.id

    derpChain.total++

    // Only consider the chain started once we get a mininum length
    if (derpChain.total >= MIN_CHAIN_TO_START)
        derpChain.started = true

    if (derpChain.started)
    {
        // Check if we've just passed the record, and react to the message
        if (derpChain.total === derpChainRecord + 1)
            message.react('🎉')
    }
})

client.login(process.env.DERP_BOT_TOKEN)

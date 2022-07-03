const { Client, Intents, Interaction, MessageActionRow, MessageButton } = require('discord.js');
const { token } = require('./config.json');
const { ticTacToe } = require('./databaseObjects.js');


const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});

client.once('ready', () => {

    console.log('Ready!');
})

// code for bot to say 'pong' when a user says ping
client.on('messageCreate' , (message) => {

    // check if the message came from the bot, do not message
    if(message.author.id === client.user.id) return;

    // check if the message has ping, reply
    if(message.content === "ping"){
        message.reply("pong");
    }
})

/* Tic Tac Toe */
let EMPTY = Symbol("empty");
let PLAYER = Symbol("player");
let BOT = Symbol("bot");

// initial state of tic tac toe is an empty 3x3 Matrix
let tictactoe_state 

function makeGrid() {
    
    components = []
    
    for (let row = 0; row < 3; row++){

        actionRow = new MessageActionRow()

        for (let col = 0; col < 3; col++) {
            messageButton = new MessageButton()
                .setCustomId('tictactoe_' + row + '_' + col)

            switch(tictactoe_state[row][col]) {
                
                case EMPTY:
                    messageButton
                        .setLabel(' ')
                        .setStyle('SECONDARY')

                    break;
                case PLAYER:
                    messageButton
                        .setLabel('X')
                        .setStyle('PRIMARY')
                    break;
                case BOT:
                    messageButton
                        .setLabel('O')
                        .setStyle('DANGER')
                    break;


            }
    
            actionRow.addComponents(messageButton)
        }

        components.push(actionRow)

    }

    return components
}

// function to select random number
function getRandomInt(max){
    return Math.floor(Math.random() * max);
}

function isDraw(){

    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col ++){

            if (tictactoe_state[row][col] == EMPTY){
                return false;
            }

        }
    }
    return true;
}

// winner is when a whole row or column or diagonally are all the same symbol and not empty
function isGameOver(){

    for (let i = 0; i < 3; i++){

        // checking horizontally
        if ((tictactoe_state[i][0] == tictactoe_state[i][1] && tictactoe_state[i][1] == tictactoe_state[i][2]) && tictactoe_state[i][2] != EMPTY) {
            return true;
        }

        // checking vertically
        if ((tictactoe_state[0][i] == tictactoe_state[1][i] && tictactoe_state[1][i] == tictactoe_state[2][i]) && tictactoe_state[2][i] != EMPTY) {
            return true;
        }

    }

    // diagonal case
    if (tictactoe_state[1][1] != EMPTY) {
        if (
            (tictactoe_state[0][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[0][2]) ||
            (tictactoe_state[2][0] == tictactoe_state[1][1] && tictactoe_state[1][1] == tictactoe_state[0][2])) {
            return true;
        }
    }

    return false;
}

// button interactions
client.on('interactionCreate', async interaction => {

    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('tictactoe')) return;

    if (isGameOver()){
        interaction.update({
            components: makeGrid()
        })
        
        return;
    }

    // parsing fields by splitting custom id using _
    let parsedFields = interaction.customId.split("_")
    let row = parsedFields[1]
    let col = parsedFields[2]

    if (tictactoe_state[row][col] != EMPTY){ // if player selects an already filled grid

        interaction.update({
            content:  "you cannot select that slot",
            components: makeGrid()
        })

    }

    tictactoe_state[row][col] = PLAYER;

    // statements that check if the game resulted in a draw or player win
    if (isGameOver()){

        let user = await ticTacToe.findOne({
            where: {
                user_id: interaction.user.id
            }
        });

        if (!user) {
            user = await ticTacToe.create({ user_id: interaction.user.id });
        }

        await user.increment('score');

        interaction.update({
            content: "You won, your score is " + (user.get('score') + 1),
            components: []
        })
        
        return;
    }

    if (isDraw()){
        interaction.update({
            content: "The game ended in a draw",
            components: []
        })
        
        return;
    }

    // bot button selection, will be random
    let botRow
    let botCol
    do {
        botRow = getRandomInt(3);
        botCol = getRandomInt(3);
    } while(tictactoe_state[botRow][botCol] != EMPTY);

    tictactoe_state[botRow][botCol] = BOT;

    // statements that check if the game resulted in a draw or bot win
    if (isGameOver()){
        interaction.update({
            content: "You lost",
            components: makeGrid()
        })
        
        return;
    }

    if (isDraw()){
        interaction.update({
            content: "The game ended in a draw",
            components: []
        })
        
        return;
    }

    interaction.update({
        components: makeGrid()
    })


})

// responding to tic tac toe command
client.on('interactionCreate', async interaction => {

    if(!interaction.isCommand()) return;

    const{ commandName } = interaction;

    if ( commandName === 'tictactoe') {

        tictactoe_state = [

            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY],
            [EMPTY, EMPTY, EMPTY]

        ]

        await interaction.reply({ content: 'Playing a game of tic-tac-toe', components: makeGrid() });
    }
})

// login to client i.e activate our Bot
client.login(token);
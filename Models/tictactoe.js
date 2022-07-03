module.exports = (sequelize, DataTypes) => {
    return sequelize.define('tictactoe', {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false,
        }
    })
}
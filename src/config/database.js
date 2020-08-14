module.exports ={
    dialect: 'postgres',
    host: 'localhost',
    username:'postgres',
    password:'docker',
    database:'goBarber',
    define:{
        timestamps:true,
        underscored:true,
        underscoredAll:true,
    },
};
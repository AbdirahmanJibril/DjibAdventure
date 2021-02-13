const faker = require('faker');
const {Post} =require('./models/user');

async function seedPosts(){
   
    for(const i of new Array(40)){
        const post = {
            title:faker.lorem.word(),
            place:faker.lorem.word(),
            description:faker.lorem.text(),
            author:{
                "_id" : "60169627feb209298892af65",
               "email" : "abdi@gmail.com"
            }
        }
        await Post.create(post);
    }
    console.log('40 new postscreated');
}

module.exports = seedPosts;
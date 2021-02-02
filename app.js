//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const app = express();
const _ = require('lodash');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://vmattz:' + process.env.PASSWORD + '@cluster0.k41nf.mongodb.net/todolistDB', {useNewUrlParser: true})

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('item',itemsSchema);

const workout = new Item({
  name:'Workout'
});
const clean = new Item({
  name:'Clean'
});
const cook = new Item({
  name:'Cook'
});
const defaultItems = [workout, clean, cook];



const listSchema = new mongoose.Schema({
  name: String,
  items:[itemsSchema]
});

const List = mongoose.model('List', listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length ===0) {
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log('Everything went well with inserting the doc');
        }
      });
      res.redirect('/');
    } else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    };
  });
});

app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList) {
    if (!err) {
      if (!foundList) {
         //create a new list

         const list1 = new List({
         name:customListName,
         items:defaultItems
         });
         list1.save();
         res.redirect('/' + customListName)
      } else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });
  
});



app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    })
  }

});


app.post('/delete', function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){

    Item.findByIdAndRemove(checkedItemId, function(err){
      if (err){
        console.log(err);
      } else {
        console.log('successfully removed item from list');
      }
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItemId}}}, function(err, results){
      if (!err){
        res.redirect('/' + listName);
      }
    })
  }

});



// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});

//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {
  useNewUrlParser: true
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {
  Item.find({}, (err, itemsFound) => {

    if (itemsFound.lenght === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err)
          console.log(err);
        else
          console.log("Successfully saved default items.");
      });
      res.redirect('/');

    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: itemsFound
      });
    }
  })
});

app.get('/:customListName', (req, res) => {
  const listName = _.capitalize(req.params.customListName);

  List.findOne({
    name: listName
  }, (err, results) => {
    if (!err) {
      if (!results) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect('/' + customListName);

      } else {
        res.render('list', {
          listTitle: listName,
          newListItems: results.items
        });

      }
    }

  })
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({
      name: listName
    }, (err, results) => {
      results.items.push(itemName);
      results.save();
      res.redirect('/' + listName);
    })
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, (err) => {
      if (err)
        console.log(err);
      else
        console.log("Successfully deleted!");
      res.redirect('/');
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, (err, results) => {
      if(!err){
        res.redirect('/' + listName);
      }
    });
  }


});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
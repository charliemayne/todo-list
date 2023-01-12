const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// mongoDB with mongoose
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true}); 

// create 'items' schema
const itemsSchema = {
    name: String
};

// create mongoose model
const Item = mongoose.model("Item", itemsSchema);

// create some default items
const item1 = new Item({
    name: "Welcome to your To-Do List!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Check this to delete an item."
});

const defaultItems = [item1, item2, item3];

// Item.insertMany(defaultItems, function(err) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log("Successfully added default list to Items");
//     }
// });


// lists schema
const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



// home route
app.get("/", function(req, res) {

    Item.find({}, function(err, foundItems){
  
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully savevd default items to DB.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    });
  
});

app.post("/", function(req, res) {
    
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    // check if listName is Today or custom list
    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function(req, res) {
    const itemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(itemId, function(err){
            if (!err) {
                console.log("Deleted item.");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemId}}}, function(err, foundList){
            if (!err) {
                console.log("Deleted item.");
                res.redirect("/" + listName);
            } else {
                console.log(err);
            }
        });
    }

    
});

app.get("/:customListName", function(req, res) {
    const customeListName = req.params.customListName;

    // check if list already exists
    List.findOne({name: customeListName}, function(err, results) { // findOne vs find is important!
        if (!err) {
            if (!results) {
                // create new list
                const list = new List({
                    name: customeListName,
                    items: defaultItems
                });

                list.save();

                res.redirect("/" + customeListName);

            } else {
                // show existing list
                res.render("list", {listTitle: customeListName, newListItems: results.items})
            }
        }
    })

    const list = new List({
        name: customeListName,
        items: defaultItems
    });

    list.save();
})


// about route
app.get("/about", function(req, res) {
    res.render("about");
})




// listening on port 3000
app.listen(3000, function() {
    console.log("Server started on port 3000");
})
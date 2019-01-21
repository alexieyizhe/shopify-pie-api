const firebase = require('firebase');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
require('firebase/firestore');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

/* ----------- INITIALIZE FIREBASE APP ----------- */
const config = {
  apiKey: "AIzaSyDYtvtsBx6Y_LPnzsMMR53sDjJb2jl2Ac8",
  authDomain: "shopify-dev-challenge-s19.firebaseapp.com",
  databaseURL: "https://shopify-dev-challenge-s19.firebaseio.com",
  projectId: "shopify-dev-challenge-s19",
  storageBucket: "shopify-dev-challenge-s19.appspot.com",
  messagingSenderId: "595851002278"
};
admin.initializeApp(config);
firebase.initializeApp(config)
let db = firebase.firestore();
let productsCollection = db.collection('products');


/* ----------- INITIALIZE EXPRESS APP ----------- */
const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json()); // Parse request body contents as json



/* ----------- ENDPOINTS FOR API ----------- */
// GET ALL PRODUCTS
app.get('/products', (req, res) => {
  const onlyGetItemsInStock = req.query.inStock;
  if(onlyGetItemsInStock === 'true') { // TODO: optimize this if else statement
    productsCollection.where("inventory_count", ">", 0)
      .get()
      .then(productCatalogue => {
        let allProducts = productCatalogue.docs.map(doc => doc.data());
        res.status(200).json(allProducts); // got snapshot, return all products
      })
      .catch((err) => console.log(err))
  } else {
    productsCollection
      .get()
      .then(productCatalogue => {
        let allProducts = productCatalogue.docs.map(doc => doc.data());
        res.status(200).json(allProducts); // got snapshot, return all products
      })
      .catch((err) => console.log(err))
  }
});


// GET A SPECIFIC PRODUCT (by ID)
app.get('/product/:productId', (req, res) => {

  const { productId } = req.params;
  console.log(`finding pie with ID: ${productId}`)
  db.collection('products')
    .doc(productId).get()
    .then(product => {
      if(product.exists) res.status(200).json(product.data());
    })
    .catch(err => {
      console.log(err);
    });
});


// PURCHASE A PRODUCT (by ID)
app.patch('/product/:productId/purchase', (req, res) => {
  const { productId } = req.params;
  console.log(`purchasing pie with ID: ${productId}`);
  let productRef = db.collection('products').doc(productId);
  productRef.get()
    .then(product => {
      if(product.exists && product.data().inventory_count > 0) {
        productRef.update({inventory_count: product.data().inventory_count - 1})
        res.status(200).send(`Successfully purchased ${product.data().name}!`);
      } else if(product.exists) {
        res.status(200).send(`Purchase failed - that pie is out of stock :(`);
      } else {
        res.status(200).send(`Purchase failed - that pie doesn't exist :(`);
      }
    })
    .catch(err => {
      console.log(err);
    });
})


// Delete a specific product TODO
app.delete('/products/:productId', (req, res) => {
})

// ADD A PRODUCT TODO
app.post('/products', (req, res) => {
  const { newProductName, newProductPrice, newProductInventory } = req.body;
  db.collection('products')
    .add({ newProductName, newProductPrice, newProductInventory })
    .then(product => {

    })
    .catch(err => {
      console.log(err);
    });
})



/* ----------- EXPORT API AS FUNCTION ----------- */
exports.mainAPI = functions.https.onRequest(app);

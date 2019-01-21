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
let cartsCollection = db.collection('carts');

// Firebase helpers
const getSingleProduct = (productId) => {
  console.log('getting product');
  return productsCollection
    .doc(productId).get()
    .then(product => {
      if(product.exists) return product.data();

      return null;
    })
    .catch(err => {
      console.log(err);
    });
}

const purchaseSingleProduct = (productId) => {
  let productRef = productsCollection.doc(productId);
  return productRef.get()
    .then(product => {
      if(product.exists && product.data().inventory_count > 0) {
        productRef.update({inventory_count: product.data().inventory_count - 1});
        return {
          purchased: true,
          msg: `Successfully purchased ${product.data().name}!`
        };
      } else if(product.exists) {
        return {
          purchased: false,
          msg: 'Purchase failed - that pie is out of stock :('
        };
      } else {
        return {
          purchased: false,
          msg: 'Purchase failed - that pie doesn\'t exist!'
        };
      }
    })
    .catch(err => {
      console.log(err);
    });
}

const getSingleCart = (cartId) => {
  console.log('getting cart');
  return cartsCollection
    .doc(cartId).get()
    .then(cart => {
      if(cart.exists) return cart.data();

      return null;
    })
    .catch(err => {
      console.log(err);
    });
}


const purchaseCart = (cartId) => {
  let cartRef = cartsCollection.doc(cartId);
  return cartRef.get()
    .then(cart => {
      if(cart.exists) {
        let cartProducts = [];
        cart.data().products.forEach(productId => {
          cartProducts.push(
            purchaseSingleProduct(productId)
             .then(purchaseResults => {
               console.log(purchaseResults.purchased);
               return purchaseResults.purchased;
             })
             .catch(err => {
               console.log(err);
             })
           );
          });
         console.log(cartProducts);

        let cartProductPurchaseResults = Promise.all(cartProducts);
        return cartProductPurchaseResults.then(result => {
          if(result.every(r => r)) { // All purchases for individual items succeeded
            cartRef.update({products: [], total: 0});
            return `Successfully finished checkout - your total was $${cart.data().total}.`;
          } else {
            return 'Could not check out - one or more items are probably out of stock.';
          }
        });

      } else {
        return 'The cart was not found!';
      }
    })
    .catch(err => {
      console.log(err);
    });
}





/* ----------- INITIALIZE EXPRESS APP ----------- */
const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json()); // Parse request body contents as json



/* ----------- ENDPOINTS FOR API ----------- */
// GET ALL PRODUCTS
app.get('/products', (req, res) => {
  const onlyGetItemsInStock = req.query.inStock;
  let minStock = (onlyGetItemsInStock === 'true') ? 1 : 0;
  productsCollection.where("inventory_count", ">=", minStock)
    .get()
    .then(productCatalogue => {
      let allProducts = productCatalogue.docs.map(doc => doc.data());
      res.status(200).json(allProducts); // got snapshot, return all products
    })
    .catch((err) => console.log(err))
});


// GET A SPECIFIC PRODUCT (by ID)
app.get('/product/:productId', (req, res) => {
  const { productId } = req.params;
  getSingleProduct(productId)
    .then(foundProduct => {
      if(foundProduct) res.status(200).json(foundProduct);
      else res.status(200).send('Could not find product!');
    })
    .catch(err => {
      console.log(err);
      res.status(200).send('An error occurred.');
    });
});


// PURCHASE A PRODUCT (by ID)
app.patch('/product/:productId/purchase', (req, res) => {
  const { productId } = req.params;
  purchaseSingleProduct(productId)
    .then(purchaseResults => {
      res.status(200).send(purchaseResults.msg);
    })
    .catch(err => {
      console.log(err);
      res.status(200).send('An error occurred.');
    });
});


// GET A SPECIFIC CART (by ID)
app.get('/cart/:cartId', (req, res) => {
  const { cartId } = req.params;
  getSingleCart(cartId)
    .then(foundCart => {
      if(foundCart) res.status(200).json(foundCart);
      else res.status(200).send('Could not find cart!');
    })
    .catch(err => {
      console.log(err);
      res.status(200).send('An error occurred.');
    });
});


// PURCHASE A CART (by ID)
app.patch('/cart/:cartId/purchase', (req, res) => {
  const { cartId } = req.params;
  purchaseCart(cartId)
    .then(purchaseResults => {
      res.status(200).send(purchaseResults);
    })
    .catch(err => {
      console.log(err);
      res.status(200).send('An error occurred.');
    });
});


// ADD ITEM TO A CART (by ID)
app.patch('/cart/:cartId/add/:productId', (req, res) => {
  const { cartId, productId } = req.params;
  const itemPromise = getSingleProduct(productId)
    .then(foundProduct => {
      if(foundProduct) return foundProduct;
    })
    .catch(err => console.log(err));

  itemPromise
    .then(item => {
      if(item) {
        let cartRef = cartsCollection.doc(cartId);
        cartRef.get()
          .then(cart => {
            if(cart.exists) {
              let newCartProducts = cart.data().products;
              newCartProducts.push(productId); // cannot use firebase.firestore.FieldValue.arrayUnion since we need to allow for multiple instances of the same product
              cartRef.update({ products: newCartProducts, total: cart.data().total + item.price });
              res.status(200).send('Added item to cart!');
            } else {
              res.status(200).send('The cart was not found!');
            }
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        res.status(200).send('The product was not found!');
      }
    })
    .catch(err => console.log(err));

});

// REMOVE ITEM FROM A CART (by ID)
app.patch('/cart/:cartId/remove/:productId', (req, res) => {
  const { cartId, productId } = req.params;
  const itemPromise = getSingleProduct(productId)
    .then(foundProduct => {
      if(foundProduct) return foundProduct;
    })
    .catch(err => console.log(err));

  itemPromise
    .then(item => {
      if(item) {
        let cartRef = cartsCollection.doc(cartId);
        cartRef.get()
          .then(cart => {
            if(cart.exists) {
              let newCartProducts = cart.data().products;
              const itemPos = newCartProducts.indexOf(productId);
              if(itemPos >= 0) newCartProducts.splice(itemPos, 1); // cannot use firebase.firestore.FieldValue.arrayRemove since we need to remove just one instance at a time
              cartRef.update({ products: newCartProducts, total: cart.data().total - item.price });
              res.status(200).send('Removed item to cart!');
            } else {
              res.status(200).send('The cart was not found!');
            }
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        res.status(200).send('The product was not found!');
      }
    })
    .catch(err => console.log(err));

});


// ADD A CART
app.post('/carts', (req, res) => {
  cartsCollection
    .add({ products: [], total: 0 })
    .then(cartRef => {
      res.status(200).send(`A new cart was created with ID ${cartRef.id}!`);
    })
    .catch(err => {
      console.log(err);
    });
})


/* ----------- EXPORT API AS FUNCTION ----------- */
exports.mainAPI = functions.https.onRequest(app);

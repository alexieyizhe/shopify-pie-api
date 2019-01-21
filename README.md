# The Shopiefy API

An API for pie lovers. Also an API for any type of product, but let's be real - pies are the only thing worth querying for.

### Motivation

This was created as part of the [Shopify Developer Intern Challenge (Summer 2019)](https://docs.google.com/document/d/1J49NAOIoWYOumaoQCKopPfudWI_jsQWVKlXmw1f1r-4/edit), and is live at [the following link](https://us-central1-shopify-dev-challenge-s19.cloudfunctions.net/mainAPI)!  

### API

Accessible at https://us-central1-shopify-dev-challenge-s19.cloudfunctions.net/mainAPI/ENDPOINT

### Endpoints

- 🥧 Get all products: `/products` **[GET]**
  - Append the `inStock=true` query parameter to only see products that are in stock (_ex._ `/products?inStock=true`)
- 🥧 Find a single product by ID: `/products/{productID}` **[GET]**
- ~~🥧 Purchase a product `/product/{productID}/purchase` **[PATCH]**~~
  - This is disabled, you must add a product to a cart before you can purchase it by checking out with the cart
- 🛒 Get a cart and its contents by ID: `/cart/{cartID}` **[GET]**
- 🛒 Create a cart: `/carts` **[POST]**
- 🛒 Add a product to a cart, both by ID: `/cart/{cartID}/add/{productID}` **[PATCH]**
- 🛒 Remove a product from a cart, both by ID: `/cart/{cartID}/remove/{productID}`  **[PATCH]**
- 🛒 Checkout with a cart by ID: `/cart/{cartID}/purchase` **[PATCH]**

### A Learning Experience

I was able to gain a deeper understanding of Promises and working in an async environment in general. I had never integrated Firebase with another framework (Express, in this case) before, so that was also a learning experience :D

### Development

#### Setting up

- Use `git clone` to clone this repository. Alternatively, download the source code.
- Make sure you're in the `functions/` folder by executing `cd functions/`.
- Make sure required dependencies have been installed using `npm install`.  

#### Development and testing

- Execute:
  - `npm run serve` to create a local server running the site and more importantly, the API.
  - `npm run shell` to open up Firebase's shell for testing cloud functions.
  - `npm run lint` to run eslint on the project.

#### Building for production

- Run `firebase deploy` to deploy the API and the site.

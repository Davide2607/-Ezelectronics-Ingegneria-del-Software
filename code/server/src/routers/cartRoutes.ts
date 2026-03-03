import express, { Router } from "express"
import ErrorHandler from "../helper"
import { body, param } from "express-validator"
import CartController from "../controllers/cartController"
import Authenticator from "./auth"
import  ProductDAO  from "../dao/productDAO"
import * as cartErrors from "../errors/cartError"
import { Cart } from "../components/cart"
import CartDAO from "../dao/cartDAO"


/**
 * Represents a class that defines the routes for handling carts.
 */
class CartRoutes {
    private cartController: CartController
    private router: Router
    private errorHandler: ErrorHandler
    private authenticator: Authenticator
    private productDAO: ProductDAO
    private cartDAO: CartDAO

    /**
     * Constructs a new instance of the CartRoutes class.
     * @param {Authenticator} authenticator - The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authenticator = authenticator
        this.cartController = new CartController()
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.productDAO = new ProductDAO()
        this.cartDAO = new CartDAO()
        this.initRoutes()
    }

    /**
     * Returns the router instance.
     * @returns The router instance.
     */
    getRouter(): Router {
        return this.router
    }

    /**
     * Initializes the routes for the cart router.
     * 
     * @remarks
     * This method sets up the HTTP routes for creating, retrieving, updating, and deleting cart data.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     */
    initRoutes() {

        /**
         * Route for getting the cart of the logged in customer.
         * It requires the user to be logged in and to be a customer.
         * It returns the cart of the logged in customer.
         */
        this.router.get(
            "/",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,            
            (req: any, res: any, next: any) => this.cartController.getCart(req.user)
                .then((cart: Cart) => {
                    res.status(200).json(cart)
                })
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for adding a product unit to the cart of the logged in customer.
         * It requires the user to be logged in and to be a customer.
         * It requires the following body parameters:
         * - model: string. It cannot be empty, it must represent an existing product model, and the product model's available quantity must be above 0
         * It returns a 200 status code if the product was added to the cart.
         */
        this.router.post(
            "/",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,
            (req:any, res:any, next:any) => {
                        
                // Check if model is not empty
                if (!req.body || typeof req.body.model !== 'string' || req.body.model.trim() === '') {
                 
                    return res.status(422).json({ error: 'Model cannot be empty' });
                }
            
                // Check if model represents an existing product model with an available quantity above 0
                // This requires a function getProductByModel that returns a product by its model
                this.productDAO.getProducts("model", null, req.body.model)
                    .then((products) => {
                        const product = products[0];
                        
                        if (!product){
                            
                            return res.status(404).json({ error: 'Model not exists' });
                        }
                        if(product.quantity <= 0) {
                            
                            return res.status(409).json({ error: 'Insufficient quantity' });
                        }
            
                        // If all checks pass, call next to proceed to the route handler
                        next();
                    })
                    .catch((err) => {
                        next(err);
                    });
            },
            (req: any, res: any, next: any) => this.cartController.addToCart(req.user, req.body.model)
                .then(() => res.status(200).end())
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for checking out the cart of the logged in customer.
         * It requires the user to be logged in and to be a customer.
         * It returns a 200 status code if the cart was checked out.
         * It fails if the cart is empty, there is no current cart in the database, or at least one of the products in the cart is not available in the required quantity.
         */
        this.router.patch(
            "/",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,
            async (req: any, res: any, next: any) => {
                try {
                    // Try to get the unpaid cart
                    await this.cartDAO.getUnpaidCart(req.user)
                        .then(async (cart) => {
                            // If cart is found, process it
                            const products = await this.productDAO.getProducts(null, null, null);
        
                            for (let i = 0; i < cart.products.length; i++) {
                                const cartProduct = cart.products[i];
                                const product = products.find(p => p.model === cartProduct.model);
        
                                if (product) {
                                    if (product.quantity === 0) {
                                        return res.status(409).json({ error: "Insufficient quantity" });
                                    } else if (cartProduct.quantity > product.quantity) {
                                        return res.status(409).json({ error: "Not enough products" });
                                    }
                                }
                            }
        
                            next();
                        })
                        .catch(async (err) => {
                            // If no unpaid cart is found, check for an empty cart
                            await this.cartDAO.getEmptyCart(req.user)
                                .then((emptyCart) => {
                                    return res.status(400).json({ error: new cartErrors.EmptyCartError().customMessage })
                                })
                                .catch((emptyCartErr) => {
                                    return res.status(404).json({ error: new cartErrors.CartNotFoundError().customMessage });
                                });
                        });
                } catch (err) {
                    next(err);
                }         
                 
            },
            (req: any, res: any, next: any) => {
                this.cartController.checkoutCart(req.user)
                    .then(() => res.status(200).end())
                    .catch((err) => {
                        next(err);
                    });
            }
        );
        

        /**
         * Route for getting the history of the logged in customer's carts.
         * It requires the user to be logged in and to be a customer.
         * It returns the history of the logged in customer's carts (only carts that have been paid for are returned - the current cart is not included in the list).
         */
        this.router.get(
            "/history",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,
            (req: any, res: any, next: any) => this.cartController.getCustomerCarts(req.user)
                .then((carts: Cart[]) => res.status(200).json(carts))
                .catch((err) => next(err))
        )

        /**
         * Route for removing a product unit from a cart.
         * It requires the user to be logged in and to be a customer.
         * It requires the model of the product to remove as a route parameter. The model must be a non-empty string, the product must exist, must be in the current cart, and the customer must have a current cart
         * It returns a 200 status code if the product was removed from the cart.
         */
        this.router.delete(
            "/products/:model",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,
            (req: any, res: any, next: any) => {
        
                // Check if model is not empty
                if (req.params.model.trim() === '') {
                    return res.status(400).json({ error: 'Model cannot be empty' });
                }
                
        
                // Check if model represents an existing product model with an available quantity above 0
                this.productDAO.getProducts("model", null, req.params.model)
                    .then((products) => {
                        
                        const product = products[0];
                       
                        if (!product){
                            return res.status(404).json({ error: 'Model not exists' });
                        
                        }        
                        // If all checks pass, call next to proceed to the route handler
                        next();
                    })
                    .catch((err) => {
                        next(err);
                    });
            },
            (req: any, res: any, next: any) => {
                this.cartController.getCart(req.user)
                .then((cart) => {
                    if(cart.products.length == 0){
                        return res.status(404).json({ error: new cartErrors.EmptyCartError().customMessage }); // Changed to 400 for empty or non-existing cart
                    } else if (!cart.products.find((p) => p.model == req.params.model)){
                        return res.status(404).json({ error: new cartErrors.ProductNotInCartError().customMessage });
                    }
        
                    next();
        
                })
                .catch((err)=>{
                    return res.status(404).json({ error: new cartErrors.CartNotFoundError().customMessage });
                })
            },
            (req: any, res: any, next: any) => this.cartController.removeProductFromCart(req.user, req.params.model)
                .then(() => res.status(200).end())
                .catch((err) => {
                    next(err);
                })
        );
        
        /**
         * Route for removing all products from the current cart.
         * It requires the user to be logged in and to be a customer.
         * It fails if the user does not have a current cart.
         * It returns a 200 status code if the products were removed from the cart.
         */
        this.router.delete(
            "/current",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,
            (req:any, res:any, next:any) => {
                this.cartController.getCart(req.user)
                .then((cart) => {
                    if(!cart || cart.products.length == 0){
                        return  res.status(404).json({ error: new cartErrors.CartNotFoundError().customMessage});
                    }

                    next();

                })
                .catch((err)=>{
                    next(err);
                })
            },
            (req: any, res: any, next: any) => this.cartController.clearCart(req.user)
                .then(() => res.status(200).end())
                .catch((err) => next(err))
        )

        /**
         * Route for deleting all carts.
         * It requires the user to be authenticated and to be either an admin or a manager.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,
            (req: any, res: any, next: any) => this.cartController.deleteAllCarts()
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for retrieving all carts of all users
         * It requires the user to be authenticated and to be either an admin or a manager.
         * It returns an array of carts.
         */
        this.router.get(
            "/all",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,
            (req: any, res: any, next: any) => this.cartController.getAllCarts()
                .then((carts: any/**Cart[] */) => res.status(200).json(carts))
                .catch((err: any) => next(err))
        )
    }
}

export default CartRoutes
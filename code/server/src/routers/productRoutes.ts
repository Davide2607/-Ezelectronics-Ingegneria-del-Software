import express, { Router } from "express"
import ErrorHandler from "../helper"
import { body, param, query } from "express-validator"
import ProductController from "../controllers/productController"
import Authenticator from "./auth"
import { Product } from "../components/product"
import ProductDAO from "../dao/productDAO"
import dayjs from "dayjs"
import { ProductNotFoundError } from "../errors/productError"
/**
 * Represents a class that defines the routes for handling proposals.
 */
class ProductRoutes {
    private controller: ProductController
    private router: Router
    private errorHandler: ErrorHandler
    private authenticator: Authenticator
    private productDAO: ProductDAO



    /**
     * Constructs a new instance of the ProductRoutes class.
     * @param {Authenticator} authenticator - The authenticator object used for authentication.
     */
    constructor(authenticator: Authenticator) {
        this.authenticator = authenticator
        this.controller = new ProductController()
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.productDAO = new ProductDAO()
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
     * Initializes the routes for the product router.
     * 
     * @remarks
     * This method sets up the HTTP routes for handling product-related operations such as registering products, registering arrivals, selling products, retrieving products, and deleting products.
     * It can (and should!) apply authentication, authorization, and validation middlewares to protect the routes.
     * 
     */
    initRoutes() {

        /**
         * Route for registering the arrival of a set of products.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the following parameters:
         * - model: string. It cannot be empty and it cannot be repeated in the database.
         * - category: string (one of "Smartphone", "Laptop", "Appliance")
         * - quantity: number. It must be greater than 0.
         * - details: string. It can be empty.
         * - sellingPrice: number. It must be greater than 0.
         * - arrivalDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date
         * It returns a 200 status code if the arrival was registered successfully.
         */
        this.router.post(
            "/",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,
            (req: any, res: any, next: any) =>   {
                // Check if model is not empty
                
            
            if (req.body.model.trim() === '') {
                return res.status(422).json({ error: 'Model cannot be empty' });
            }
           //check if quantity grater than 0
           if (req.body.quantity<=0 || isNaN(Number(req.body.quantity)) ){
            return res.status(422).json({ error: 'Insufficient quantity' });
           }
            //check if selling price grater than 0
            if (req.body.sellingPrice<=0 || isNaN(Number(req.body.sellingPrice))){
                return res.status(422).json({ error: 'Insufficient selling Price' });
        }
            //check if the category is valid
            if (req.body.category !== "Smartphone" && req.body.category !== "Laptop" && req.body.category !== "Appliance"){
                return res.status(422).json({ error: 'invalid category' });
            }
            // check if `arrivalDate` is after the current date

            const dateFormat = /^\d{4}-\d{2}-\d{2}$/;

            if (req.body.arrivalDate && (isNaN(Date.parse(req.body.arrivalDate))|| !dateFormat.test(req.body.arrivalDate))) {
                return res.status(422).json({ error: 'Invalid Date' });
            }

           if (req.body.arrivalDate && dayjs(req.body.arrivalDate).isAfter(dayjs(), 'day') ) {
                return res.status(400).json({ error: 'arrival date cannot be after today' });
            }

            if (!req.body.arrivalDate || req.body.arrivalDate.trim() === '') {
                req.body.arrivalDate = dayjs().format('YYYY-MM-DD'); // Assegna la data di oggi
            }
            
            this.productDAO.getProducts("model", null, req.body.model)
                .then((products) => {                  
                    const product = products.find((product) => product.model === req.params.model);
                    
                    if (products.length === 0){
                        next();
                    }else{
                        return res.status(409).json({error: 'Product Already Exists'})
                    }            
        

                    // If all checks pass, call next to proceed to the route handle
                })
                .catch((err) => {
                    
                    next(err);
                })    
},
            (req: any, res: any, next: any) => this.controller.registerProducts(req.body.model, req.body.category, req.body.quantity, req.body.details, req.body.sellingPrice, req.body.arrivalDate)
                .then(() => res.status(200).end())
                .catch((err) => next(err))
            )
        /*
         * Route for registering the increase in quantity of a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It requires the following body parameters:
         * - quantity: number. It must be greater than 0. This number represents the increase in quantity, to be added to the existing quantity.
         * - changeDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date and is after the arrival date of the product.
         * It returns the new quantity of the product.
         */
        this.router.patch(
            "/:model",
             this.authenticator.isLoggedIn,
             this.authenticator.isAdminOrManager,
             (req: any, res: any, next: any) =>   {
           
            //check if model is a not empty string
            if (req.params.model.trim() === "") {
                return res.status(422).json({ error: 'Model cannot be empty' });
            }
            // check if `changeDate` has a valid format
            if (req.body.changeDate && (req.body.changeDate !== dayjs(req.body.changeDate).format('YYYY-MM-DD') || isNaN(Date.parse(req.body.changeDate)))) {
                return res.status(422).json({ error: 'Invalid Date' });
            }
             //   check if `changeDate` is after the current date

             if (req.body.changeDate && dayjs(req.body.changeDate).isAfter(dayjs(), 'day') ) {
                return res.status(400).json({ error: 'change date cannot be after today' });
            }

            if (req.body.quantity<=0 || isNaN(Number(req.body.quantity)) ){
                return res.status(422).json({ error: 'Insufficient quantity' });
               }
            //check if if `model` does not represent a product in the database and `changeDate` is before the product's `arrivalDate` 

            this.controller.getProducts("model", null, req.params.model)
                .then((products) => {                   
                    if (products.length === 0) 
                        return res.status(404).json({ error: 'Product not found' });
                    
                    if (req.body.changeDate != null && dayjs(req.body.changeDate).isBefore(dayjs(products[0].arrivalDate))){ 
                        return res.status(400).json({ error: 'changeDate cannot be before arrival date' });
                    }

                    
                    // If all checks pass, call next to proceed to the route handler
                    next();
                })
                .catch((err) => {
                    next(err);
                })
            },
            (req: any, res: any, next: any) => this.controller.changeProductQuantity(req.params.model, req.body.quantity, req.body.changeDate)
                .then((quantity: any /**number */) => res.status(200).json({ quantity: quantity }))
                .catch((err) => next(err))
        )

        /**
         * Route for selling a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It requires the following body parameters:
         * - quantity: number. It must be greater than 0. This number represents the quantity of units sold. It must be less than or equal to the available quantity of the product.
         * - sellingDate: string. It can be omitted. If present, it must be a valid date in the format YYYY-MM-DD that is not after the current date and is after the arrival date of the product.
         * It returns the new quantity of the product.
         */
        this.router.patch(
            "/:model/sell",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,
              (req: any, res: any, next: any) =>{
           //check if model is a not empty string
            if (req.params.model.trim() === "") {
              return res.status(422).json({ error: 'Model cannot be empty' });
            }
          //check if quantity is greater than 0 
          if (req.body.quantity<=0 || isNaN(Number(req.body.quantity)) ){
            return res.status(422).json({ error: 'Insufficient quantity' });
           }

            // check if sellingDate, If present, is a valid date in the format YYYY-MM-DD that is 
            //not after the current date 
           if (req.body.sellingDate != null){
                if (req.body.sellingDate!==dayjs(req.body.sellingDate).format('YYYY-MM-DD') || isNaN(Date.parse(req.body.sellingDate)) )
                    return res.status(422).json({ error: 'Wrong date format' });
                if (dayjs(req.body.sellingDate).isAfter(dayjs(), 'day')) 
                    return res.status(400).json({ error: 'selling date cannot be after today' });
            }


            this.controller.getProducts("model", null, req.params.model)
            .then((products) => {
                const product = products.find((product) => product.model === req.params.model);
                //check model exist
                if (products.length === 0) 
                    return res.status(404).json({ error: 'Product not found' });
                //check selling date is after the arrival date of the product.
                if (req.body.sellingDate != null && dayjs(req.body.sellingDate).isBefore(dayjs(product.arrivalDate))) 
                    return res.status(400).json({ error: 'selling date cannot be before arrival date' });
                //check if quantity is less than or equal to the available quantity of the product.
                if (req.body.quantity > product.quantity) 
                    return res.status(409).json({ error: 'Product stock cannot satisfy the requested quantity' }); //LowProductStockError
                // If all checks pass, call next to proceed to the route handler
                next();
            })
            .catch((err) => {
                next(err);
            })

           },
            (req: any, res: any, next: any) => this.controller.sellProduct(req.params.model, req.body.quantity, req.body.sellingDate)
                .then((quantity: any /**number */) => res.status(200).json({ quantity: quantity }))
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for retrieving all products.
         * It requires the user to be logged in and to be either an admin or a manager
         * It can have the following optional query parameters:
         * - grouping: string. It can be either "category" or "model". If absent, then all products are returned and the other query parameters must also be absent.
         * - category: string. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
         * - model: string. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
         * It returns an array of Product objects.
         */
        this.router.get(
            "/",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,

            (req:any, res:any, next:any) => {

                if (req.query.grouping === "" && req.query.model === "" && req.query.category === "") {
                    return res.status(422).json({ error: 'Grouping, model, and category cannot be all empty' });
                }

                if (req.query.grouping){
                    
                    if (req.query.grouping === "category" ) {

                        if(req.query.model  || !req.query.category)
                            return res.status(422).json({ error: 'Parameters error' });

                        if (req.query.category !== "Smartphone" && req.query.category !== "Laptop" && req.query.category !== "Appliance")
                            return res.status(422).json({ error: 'Invalid category' });

                        }

                    else if (req.query.grouping === "model" ){
                        
                        if (!req.query.model || req.query.category)
                            return res.status(422).json({ error: 'Parameters error' });

                        if (req.query.model.trim() === '')
                            return res.status(422).json({ error: 'Model cannot be empty' });
                      
                        
                    }
                    else if(req.query.grouping !== "category" && req.query.grouping !== "model"){
                        return res.status(422).json({ error: 'Invalid grouping' });
                    } 
                }
                 else if (req.query.category|| req.query.model) {
                    return res.status(422).json({ error: 'Category and model must be null' });
                }
                        // If all checks pass, call next to proceed to the route handler
                        
                        next();
            },

            (req: any, res: any, next: any) => this.controller.getProducts(req.query.grouping, req.query.category, req.query.model)
                .then((products: any /*Product[]*/) => res.status(200).json(products))
                .catch((err) => {
                    next(err)
                })
        )

        /**
         * Route for retrieving all available products.
         * It requires the user to be logged in.
         * It can have the following optional query parameters:
         * - grouping: string. It can be either "category" or "model". If absent, then all products are returned and the other query parameters must also be absent.
         * - category: string. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
         * - model: string. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
         * It returns an array of Product objects.
         */
        this.router.get(
            "/available",
            this.authenticator.isLoggedIn,
            (req: any, res: any, next: any) =>{
                
                if (req.query.grouping === "" && req.query.model === "" && req.query.category === "") {
                    return res.status(422).json({ error: 'Grouping, model, and category cannot be all empty' });
                }

                if (req.query.grouping){
                    
                    if (req.query.grouping === "category" ) {

                        if(req.query.model  || !req.query.category)
                            return res.status(422).json({ error: 'Parameters error' });

                        if (req.query.category !== "Smartphone" && req.query.category !== "Laptop" && req.query.category !== "Appliance")
                            return res.status(422).json({ error: 'Invalid category' });

                        }

                    else if (req.query.grouping === "model" ){
                        
                        if (!req.query.model || req.query.category)
                            return res.status(422).json({ error: 'Parameters error' });

                        if (req.query.model.trim() === '')
                            return res.status(422).json({ error: 'Model cannot be empty' });
                        
                    }
                    else if(req.query.grouping !== "category" && req.query.grouping !== "model"){
                        return res.status(422).json({ error: 'Invalid grouping' });
                    } 
                }
                 else if (req.query.category|| req.query.model) {
                    return res.status(422).json({ error: 'Category and model must be null' });
                }
                        // If all checks pass, call next to proceed to the route handler
                        
                        next();
            }, 
            (req: any, res: any, next: any) => this.controller.getAvailableProducts(req.query.grouping, req.query.category, req.query.model)
                .then((products: any/*Product[]*/) => res.status(200).json(products))
                .catch((err) => next(err))
        )

        /**
         * Route for deleting all products.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",
            //CHECK IF ADMIN OR MANAGER 
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,            
            (req: any, res: any, next: any) => this.controller.deleteAllProducts()
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )

        /**
         * Route for deleting a product.
         * It requires the user to be logged in and to be either an admin or a manager.
         * It requires the product model as a request parameter. The model must be a string and cannot be empty, and it must represent an existing product.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,   
            (req: any, res: any, next: any) =>{
                //check if model is a not empty string
                if (!req.params.model || req.params.model.trim() === '')
                    return res.status(400).json({ error: 'Model cannot be empty' });

                this.controller.getProducts("model", null, null)
                .then((products) => {
                    
                    //check model exist
                    if (products.length === 0) 
                        return res.status(404).json({ error: 'Product not found' });
                    //ProductNotFoundError

                    next();
                }).catch((err: any) => next(err));

       },  
            (req: any, res: any, next: any) => this.controller.deleteProduct(req.params.model)
                .then(() => res.status(200).end())
                .catch((err: any) => next(err))
        )


    }
}

export default ProductRoutes
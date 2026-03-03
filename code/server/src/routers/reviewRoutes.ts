import express, { Router } from "express"
import ErrorHandler from "../helper"
import { body, param, query } from "express-validator"
import ReviewController from "../controllers/reviewController"
import Authenticator from "./auth"
import ProductDAO from "../dao/productDAO"
import ReviewDAO from "../dao/reviewDAO"
import { ProductReview } from "../components/review"

class ReviewRoutes {
    private controller: ReviewController
    private router: Router
    private errorHandler: ErrorHandler
    private authenticator: Authenticator
    private ProductDAO: ProductDAO
    private ReviewDAO: ReviewDAO

    constructor(authenticator: Authenticator) {
        this.authenticator = authenticator
        this.controller = new ReviewController()
        this.router = express.Router()
        this.errorHandler = new ErrorHandler()
        this.ProductDAO = new ProductDAO()
        this.ReviewDAO = new ReviewDAO()
        this.initRoutes()
    }

    getRouter(): Router {
        return this.router
    }

    initRoutes() {

        /**
         * Route for adding a review to a product.
         * It requires the user calling it to be authenticated and to be a customer
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It requires the following body parameters:
         * - score: number. It must be an integer between 1 and 5.
         * - comment: string. It cannot be empty.
         * It returns a 200 status code.
         */
        this.router.post(
            "/:model",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,
            body('score').isInt({ min: 1, max: 5 }),
            body('comment').isString().notEmpty(),
            this.errorHandler.validateRequest,
            (req: any, res: any, next: any) => {

                
                if (req.params.model.trim() === "" ) {
                       return res.status(400).json({ error: 'Invalid format of the model' });
                }
                   // Check if model represents an existing product model
                   this.ProductDAO.getProducts("model",null,req.params.model)
                       .then((products: any[]) => {
                        const product = products[0]
                           if (products.length === 0) {
                               return res.status(404).json({ error: 'Product does not exist' });
                           }
                        next()
                           
                        })
                        .catch((err) => {
                            next(err);
                        });
                       
               },
            (req:any, res:any, next:any) => {

                const review = this.ReviewDAO.getUserReview(req.user, req.params.model).then((review) => {
                    if(review){
                        return res.status(409).json({ error: 'You have already reviewed this product' });
                    }
                    else{
                        next();
                    }
                    
                });
                

            },
            (req: any, res: any, next: any) => this.controller.addReview(req.params.model, req.user, req.body.score, req.body.comment)
                .then(() => res.status(200).send())
                .catch((err: Error) => {
                    next(err)
                })
        )

        /**
         * Route for retrieving all reviews of a product.
         * It requires the user to be authenticathed
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It returns an array of reviews
         */
        this.router.get(
            "/:model",
            this.authenticator.isLoggedIn,
            (req: any, res: any, next: any) => {

                if (req.params.model.trim() === "" ) {
                    return res.status(400).json({ error: 'Invalid format of the model' });
                }
                // Check if model represents an existing product model
                  this.ProductDAO.getProducts("model",null,req.params.model)
                       .then((products: any[]) => {
                    
                           if (products.length === 0) {
                               return res.status(404).json({ error: 'Product does not exist' });
                           }
                           next()
                        })
                        .catch((err) => {
                            next(err);
                        });
               
               },
            (req: any, res: any, next: any) => this.controller.getProductReviews(req.params.model)
                .then((reviews: ProductReview[]) => res.status(200).json(reviews))
                .catch((err: Error) => next(err))
        )

        /**
         * Route for deleting the review made by a user for one product.
         * It requires the user to be authenticated and to be a customer
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist. The user must also have made a review for the product
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model",
            this.authenticator.isLoggedIn,
            this.authenticator.isCustomer,
            body("model").isString(), 
            (req: any, res: any, next: any) => {

                if (req.params.model.trim() === "" ) {
                    return res.status(400).json({ error: 'Invalid format of the model' });
                }
                       // Check if model represents an existing product model
            this.ProductDAO.getProducts("model",null,req.params.model)
              .then((products) => {
                   if (products.length === 0) {
                      return res.status(404).json({ error: 'Product does not exist' });
                   }
                
                   next();
                })
                .catch((err) => {
                  next(err);
                });

                      
               },
            (req: any, res: any, next: any) => {
                const review = this.ReviewDAO.getUserReview(req.user, req.params.model).then((review) => {
                    if(!review){
                        return res.status(404).json({ error: 'You have not reviewed this product' });
                    }
                    else{
                        next();
                    }
                    
                });
            },
            (req: any, res: any, next: any) => this.controller.deleteReview(req.params.model, req.user)
                .then(() => res.status(200).send())
                .catch((err: Error) => {
                    next(err)
                })
        )

        /**
         * Route for deleting all reviews of a product.
         * It requires the user to be authenticated and to be either an admin or a manager
         * It expects a product model as a route parameter. This parameter must be a non-empty string and the product must exist.
         * It returns a 200 status code.
         */
        this.router.delete(
            "/:model/all",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,
            (req: any, res: any, next: any) => {

                if (req.params.model.trim() === "" ) {
                    return res.status(400).json({ error: 'Invalid format of the model' });
                }
                    // Check if model represents an existing product model
            this.ProductDAO.getProducts("model",null,req.params.model)
               .then((products: any[]) => {

                    if (products.length === 0) {
                      return res.status(404).json({ error: 'Product does not exist' });
                    }
                    next();
                })
                .catch((err) => {
                    next(err);
                });          
            },
            (req: any, res: any, next: any) => {
                this.controller.deleteReviewsOfProduct(req.params.model)
                    .then(() => res.status(200).send())
                    .catch((err: Error) => next(err));
            }
        );

        /**
         * Route for deleting all reviews of all products.
         * It requires the user to be authenticated and to be either an admin or a manager
         * It returns a 200 status code.
         */
        this.router.delete(
            "/",
            this.authenticator.isLoggedIn,
            this.authenticator.isAdminOrManager,
            (req: any, res: any, next: any) => this.controller.deleteAllReviews()
                .then(() => res.status(200).send())
                .catch((err: Error) => next(err))
        )
    }
}

export default ReviewRoutes;
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from "@jest/globals"
import request from 'supertest'
import { app } from "../index"
import db from "../src/db/db"
import { cleanup, create_tables } from "../src/db/cleanup"
import ProductController from "../src/controllers/productController"
import {User, Role} from "../src/components/user"
import { ProductReview } from "../src/components/review"
import ReviewDAO from "../src/dao/reviewDAO"
import {Product, Category} from "../src/components/product"
import dayjs from "dayjs"
import { NoReviewProductError } from "../src/errors/reviewError"
import ReviewController from "../src/controllers/reviewController"

const routePath = "/ezelectronics"

const postUser = async (userInfo: any) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userInfo)
        .expect(200)
}

const login = async (userInfo: any) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userInfo)
            .expect(200)
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            })
    })
}

describe("Integration Test Controller Reviews", ()=>{

    let reviewController:ReviewController;

    let prodotto1:Product;
    let prodotto2:Product;
    let prodotto_no_recensione: Product
    
    let user1:User;
    let user2:User;
    let user_no_recensioni: User;

    let review1:ProductReview;
    let review2:ProductReview;

    beforeAll(async () => {

        reviewController = new ReviewController();

        prodotto1 = new Product(10, "model1", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto2 = new Product(10, "model2", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto_no_recensione = new Product(10, "model3", Category.SMARTPHONE, "2021-10-10", "details", 10)
        
        user1 = new User("username1", "name1", "surname1", Role.CUSTOMER, "", "")
        user2 = new User("username2", "name2", "surname2", Role.CUSTOMER, "", "")
        user_no_recensioni = new User("username3", "name3", "surname3", Role.CUSTOMER, "", "")

        review1 = new ProductReview(prodotto1.model, user1.username, 5, "2021-10-10", "comment")
        review2 = new ProductReview(prodotto2.model, user2.username, 3, "2021-10-10", "details")

        await create_tables();
        await cleanup();
        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");

        db.serialize(async () => {
            db.run(`
            INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity)
            VALUES (?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?)`,
            [prodotto1.model, prodotto1.sellingPrice, prodotto1.category, prodotto1.arrivalDate, prodotto1.details, prodotto1.quantity,
             prodotto2.model, prodotto2.sellingPrice, prodotto2.category, prodotto2.arrivalDate, prodotto2.details, prodotto2.quantity]);

            db.run(`
            INSERT INTO users (username, name, surname, role, password, salt, address, birthdate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user1.username, user1.name, user1.surname, user1.role, "password1", "salt1", "address1", "2021-10-10",
             user2.username, user2.name, user2.surname, user2.role, "password2", "salt2", "address2", "2021-10-10"]);

            db.run(`
            INSERT INTO productReview (model, user, score, date, comment)
            VALUES (?, ?, ?, ?, ?),
                   (?, ?, ?, ?, ?)`,
            [review1.model, review1.user, review1.score, review1.date, review1.comment,
             review2.model, review2.user, review2.score, review2.date, review2.comment]);
        })

  

    })

    afterAll(async()=>{
        await cleanup();
        await new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve(null);
                }
            });
        });
   })

    
    beforeEach(async()=>{

        jest.clearAllMocks(); 
    })
    
    afterEach(async ()=>{

    })

    describe("Add Review", ()=>{
        test("Corretto Funzionamento", async()=>{
            await reviewController.addReview(prodotto2.model, user1, review1.score, review1.comment)
        
            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM productReview WHERE model = ? AND user = ?", [prodotto2.model, user1.username], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            expect(prodotto_Db).toEqual({
                model : prodotto2.model,
                user : user1.username,
                score : review1.score,
                date : dayjs().format('YYYY-MM-DD'),
                comment : review1.comment
            })

        })

    })

    describe("Get Product Reviews", ()=>{
        test("Corretto Funzionamento", async()=>{
            const reviews = await reviewController.getProductReviews(prodotto1.model)
            expect(reviews).toEqual([review1])
        })

        

        test("Nessuna recensione del prodotto", async()=>{
            await expect(reviewController.getProductReviews(prodotto_no_recensione.model)).resolves.toEqual([])
        })

    })

    describe("delete a review", ()=>{
        test("Corretto Funzionamento", async()=>{
            await reviewController.deleteReview(prodotto2.model, user2)
        
            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM productReview WHERE model = ? AND user = ?", [prodotto2.model, user2.username], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            expect(prodotto_Db).toBeUndefined()
        })

    })

    describe("Delete all review of a product", ()=>{
        test("Corretto Funzionamento", async()=>{
            await reviewController.deleteReviewsOfProduct(prodotto2.model)
        
            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM productReview WHERE model = ?", [prodotto2.model], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            expect(prodotto_Db).toBeUndefined()
        })

    })

    describe("Delete all reviews", ()=>{
        test("Corretto Funzionamento", async()=>{
            await reviewController.deleteAllReviews()
        
            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM productReview", (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            expect(prodotto_Db).toBeUndefined()
        })

    })

})

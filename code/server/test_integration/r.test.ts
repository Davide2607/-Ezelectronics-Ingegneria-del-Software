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

describe("Integration Test DAO Reviews", ()=>{

    let reviewDao:ReviewDAO;

    let prodotto1:Product;
    let prodotto2:Product;
    let prodotto_no_recensione: Product
    
    let user1:User;
    let user2:User;
    let user_no_recensioni: User;

    let review1:ProductReview;
    let review2:ProductReview;
    let review4:ProductReview;

    beforeAll(async () => {
      

        reviewDao = new ReviewDAO();

        prodotto1 = new Product(10, "model1", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto2 = new Product(10, "model2", Category.SMARTPHONE, "2021-10-10", "details", 10)
        prodotto_no_recensione = new Product(10, "model3", Category.SMARTPHONE, "2021-10-10", "details", 10)
        
        user1 = new User("username1", "name1", "surname1", Role.CUSTOMER, "", "")
        user2 = new User("username2", "name2", "surname2", Role.CUSTOMER, "", "")
        user_no_recensioni = new User("username3", "name3", "surname3", Role.CUSTOMER, "", "")

        review1 = new ProductReview(prodotto1.model, user1.username, 5, "2021-10-10", "comment")
        review2 = new ProductReview(prodotto2.model, user2.username, 3, "2021-10-10", "details")
        review4 = new ProductReview(prodotto1.model, user2.username, 3, "2021-10-10", "details")

        await create_tables();
        await cleanup();
        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");


        db.serialize(async () => {
            db.run(`
            INSERT INTO products (model, sellingPrice, category, arrivalDate, details, quantity) 
            VALUES 
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?)
            `, [
            prodotto1.model, prodotto1.sellingPrice, prodotto1.category, prodotto1.arrivalDate, prodotto1.details, prodotto1.quantity,
            prodotto2.model, prodotto2.sellingPrice, prodotto2.category, prodotto2.arrivalDate, prodotto2.details, prodotto2.quantity,
            prodotto_no_recensione.model, prodotto_no_recensione.sellingPrice, prodotto_no_recensione.category, prodotto_no_recensione.arrivalDate, prodotto_no_recensione.details, prodotto_no_recensione.quantity
            ]);

            db.run(`
            INSERT INTO users (username, name, surname, role, password, salt, address,  birthdate) 
            VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
            user1.username, user1.name, user1.surname, user1.role, "password1", "salt1", "address1", "2021-10-10",
            user2.username, user2.name, user2.surname, user2.role, "password2", "salt2", "address2", "2021-10-10",
            user_no_recensioni.username, user_no_recensioni.name, user_no_recensioni.surname, user_no_recensioni.role, "password3", "salt3", "address3", "2021-10-10"
            ]);

            db.run(`
            INSERT INTO productReview (model, user, score, date, comment) 
            VALUES 
            (?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?),
            (?, ?, ?, ?, ?)
            `, [
            review1.model, review1.user, review1.score, review1.date, review1.comment,
            review2.model, review2.user, review2.score, review2.date, review2.comment,
            review4.model, review4.user, review4.score, review4.date, review4.comment
            ]);
        });

    
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
            await reviewDao.addReview(prodotto2.model, user1, 2, "comment")
        
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
                score : 2,
                date : dayjs().format('YYYY-MM-DD'),
                comment : "comment"
            })

        })

    })

    describe("Get Product Reviews", ()=>{
        test("Corretto Funzionamento", async()=>{
            const reviews = await reviewDao.getProductReviews(prodotto1.model)
            expect(reviews).toEqual([review1, review4])
        })

        

        test("Nessuna recensione del prodotto", async()=>{
            await expect(reviewDao.getProductReviews(prodotto_no_recensione.model)).resolves.toEqual([])
        })


    })

    describe("Get User Review", ()=>{
        test("Corretto Funzionamento", async()=>{
            const hasReview = await reviewDao.getUserReview(user1, prodotto1.model)
            expect(hasReview).toBe(true)
        })

        test("Nessuna recensione dello user", async()=>{
            const hasReview = await reviewDao.getUserReview(user_no_recensioni, prodotto2.model)
            expect(hasReview).toBe(false)
        })

    })

    describe("Delete Review", ()=>{
        test("Corretto Funzionamento", async()=>{
            await reviewDao.deleteReview(prodotto2.model, user2)
        
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


        test("Recensione non esistente", async()=>{
            await expect(reviewDao.deleteReview(prodotto2.model, user2)).rejects.toThrow(new NoReviewProductError())
        })


    })

    describe("Delete product reviews", ()=>{

        test("Corretto Funzionamento", async()=>{
            await reviewDao.deleteReviewsOfProduct(prodotto1.model)
        
            const prodotto_Db = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM productReview WHERE model = ?", [prodotto1.model], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });

            expect(prodotto_Db).toBeUndefined()
        })

       

        test("Nessuna recensione del prodotto", async()=>{
            await expect(reviewDao.deleteReviewsOfProduct(prodotto_no_recensione.model)).rejects.toThrow(new NoReviewProductError())
        })

    })

    describe("Delete all reviews", ()=>{
        test("Corretto Funzionamento", async()=>{
            await reviewDao.deleteAllReviews()
        
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



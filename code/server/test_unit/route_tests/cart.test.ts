import { test, expect, jest, describe, afterEach, beforeEach} from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import request from 'supertest'
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import ProductDAO from "../../src/dao/productDAO"
import CartDAO from "../../src/dao/cartDAO"
import { User, Role } from "../../src/components/user"
import { Cart, ProductInCart } from "../../src/components/cart"
import { CartNotFoundError, EmptyCartError, ProductInCartError, ProductNotInCartError } from "../../src/errors/cartError";
import { Product, Category } from "../../src/components/product";

const baseURL = "/ezelectronics/carts"

jest.mock("../../src/controllers/cartController")
jest.mock("../../src/routers/auth")

describe("Cart Routes", () => {

    const cartController = new CartController()
    const CartDao = new CartDAO()
    
    afterEach(() => {
        jest.clearAllMocks();
    })

    const cart = new Cart("username", false, "paymentDate", 1, []);
    const fullcart = new Cart( "testUser2", false, "paymentDate", 1, [new ProductInCart("model", 1, Category.SMARTPHONE, 5)]);

    describe("Ottienere il carrello dell'utente", () => {
        test("Funzionamento corretto", async()=>{

            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });
          

            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart);
            const response = await request(app).get(baseURL);
            
            expect(response.status).toBe(200);
            expect(response.body).toEqual(cart);
            expect(mockGetCart).toHaveBeenCalledTimes(1);

        })

        test("Errore nel controller", async()=>{ 
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });
            

            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error());
            const response = await request(app).get(baseURL).catch((err) => {
                expect(err).toBeTruthy();
            });
        });
        
    });

    describe("Aggiungere un prodotto al carrello", () => {

        test("Funzionamento corretto", async()=>{ 
                
                const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
                const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
                jest.mock('express-validator', () => ({
                    body: jest.fn().mockImplementation(() => ({
                        isString: () => ({ isLength: () => ({}) }),
                        isNumeric: () => ({ isLength: () => ({}) }),
                    })),
                }))
    
                const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
                mockIsLoggedIn.mockImplementation((req, res, next) => {
                    req.user = testUser
                    return next();
                });
    
                const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
                mockIsCustomer.mockImplementation((req, res, next) => {
                    return next();
                });

                const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);
                
                const mockAddProductToCart = jest.spyOn(CartController.prototype, "addToCart").mockResolvedValueOnce(true);
                const response = await request(app).post(baseURL).send({model: product.model});
                expect(response.status).toBe(200);
                expect(mockAddProductToCart).toHaveBeenCalledTimes(1);
        })

        test("Errore nel controller", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
                const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
                jest.mock('express-validator', () => ({
                    body: jest.fn().mockImplementation(() => ({
                        isString: () => ({ isLength: () => ({}) }),
                        isNumeric: () => ({ isLength: () => ({}) }),
                    })),
                }))
    
                const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
                mockIsLoggedIn.mockImplementation((req, res, next) => {
                    req.user = testUser
                    return next();
                });
    
                const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
                mockIsCustomer.mockImplementation((req, res, next) => {
                    return next();
                });

                const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);
                
                const mockAddProductToCart = jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new Error());
                const response = await request(app).post(baseURL).send({model: product.model}).catch((err) => {
                    expect(err).toBeTruthy();
                });
        })

        test("Modello vuoto", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, " ", Category.SMARTPHONE, "arrivalDate", "details", 5)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            
            const response = await request(app).post(baseURL).send({model: product.model});
            expect(response.status).toBe(422);
            expect(response.body).toEqual({"error":"Model cannot be empty"})
        })

        test("Modello non esistente", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([]);
            
            
            const response = await request(app).post(baseURL).send({model: product.model});
            expect(response.status).toBe(404);
            expect(response.body).toEqual({"error":"Model not exists"})
        })

        test("Errore nella verifica modello esistente", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(new Error());
            
            
            const response = await request(app).post(baseURL).send({model: product.model}).catch((err) => {
                expect(err).toBeTruthy();
            });
        })

        test("Quantità non sufficienza", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 0)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);
            
           
            const response = await request(app).post(baseURL).send({model: product.model});
            expect(response.status).toBe(409);
            expect(response.body).toEqual({"error":"Insufficient quantity"})
        })
    });

    describe("Checkout carrello", ()=>{
        test("Funzionamento corretto", async () => {
            const testUser = new User("testUser2", "name", "surname", Role.CUSTOMER, "address", "birthdate");
        
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUser;
                next();
            });
        
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                next();
            });
        
            const new_cart = new Cart("testUser2", false, "paymentDate", 1, [new ProductInCart("model", 1, Category.SMARTPHONE, 5)]);
            const mockGetCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(new_cart);
            const mockGetProduct = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 10)]);
            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValueOnce(true);
        
            const response = await request(app).patch(baseURL);
        
            expect(response.status).toBe(200);
            expect(mockCheckoutCart).toHaveBeenCalledTimes(1);
        });
        

        test("Errore nel controller", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockCheckoutCart = jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error());
            const response = await request(app).patch(baseURL).catch((err) => {
                expect(err).toBeTruthy();
            });
        })

        test("Cart not found", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });
            
            const mockGetCart = jest.spyOn(CartDao, "getUnpaidCart").mockImplementation(() => Promise.resolve(undefined as any));
            const mockGetEmptyCart = jest.spyOn(CartDao, "createEmptyCart").mockResolvedValueOnce(undefined as any);
            const response = await request(app).patch(baseURL);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({"error":new CartNotFoundError().customMessage})
        })

        test("Cart vuoto", async () => {
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUser;
                next();
            });
        
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                next();
            });
        
            const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(undefined as any);
            const mockGetEmptyCart = jest.spyOn(CartDAO.prototype, "getEmptyCart").mockResolvedValue(null as any); // Ensure it returns null for the test
        
            const response = await request(app).patch(baseURL);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: new EmptyCartError().customMessage });
        });
        

        test("Prodotto nel negozio con quantità insufficiente", async () => {
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUser;
                next();
            });
        
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                next();
            });
        
            const new_cart = new Cart("testUser2", false, "paymentDate", 1, [new ProductInCart("model", 1, Category.SMARTPHONE, 5)]);
            const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(new_cart);
            const mockGetProduct = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 0)]);
        
            const response = await request(app).patch(baseURL);
            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: "Insufficient quantity" });
        });
        
        test("Prodotto nel negozio con quantità inferiore a quella nel cart", async () => {
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUser;
                next();
            });
        
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                next();
            });
        
            const new_cart = new Cart("testUser2", false, "paymentDate", 1, [new ProductInCart("model", 10, Category.SMARTPHONE, 5)]);
            const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(new_cart);
            const mockGetProduct = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 2)]);
        
            const response = await request(app).patch(baseURL);
            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: "Not enough products"});
        });
        
    
    });

    describe("Cronologia Carrelli", ()=>{
        test("Funzionamento corretto", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetCartHistory = jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValueOnce([cart]);
            const response = await request(app).get(baseURL+"/history");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([cart]);
            expect(mockGetCartHistory).toHaveBeenCalledTimes(1);
        })

        test("Errore nel controller", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetCartHistory = jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error());
            const response = await request(app).get(baseURL+"/history").catch((err) => {
                expect(err).toBeTruthy();
            });
        })
    });

    describe("Rimuovere un prodotto dal carrello", ()=>{
        test("Funzionamento corretto", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            const productInCart = new ProductInCart(product.model, product.quantity, product.category, product.sellingPrice)
            const newCart = new Cart("username", false, "paymentDate", 1, [productInCart]);
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);

            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(newCart);

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValueOnce(true);
            const response = await request(app).delete(baseURL + "/products/" +`${product.model}`);

            expect(response.status).toBe(200);
            expect(mockRemoveProductFromCart).toHaveBeenCalledTimes(1);
        })

        test("Errore nel controller", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            const productInCart = new ProductInCart(product.model, product.quantity, product.category, product.sellingPrice)
            const newCart = new Cart("username", false, "paymentDate", 1, [productInCart]);
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);

            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(newCart);

            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error());
            const response = await request(app).delete(baseURL + "/products/" +`${product.model}`).catch((err) => {
                expect(err).toBeTruthy();
            });
        })

        test("Modello nullo", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const model:string | null = " "
            const product = new Product(10, " ", Category.SMARTPHONE, "arrivalDate", "details", 5)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            
            const response = await request(app).delete(baseURL + "/products" +`/${encodeURIComponent(model)}`);
            expect(response.status).toBe(400);
            expect(response.body).toEqual({"error":"Model cannot be empty"})
        })

        test("Modello non esistente", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([]);
            
            const response = await request(app).delete(baseURL + "/products" +`/${product.model}`);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({"error":"Model not exists"})
        })

        test("Errore nella verifica modello esistente", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(new Error());
            
            const response = await request(app).delete(baseURL + "/products" +`/${product.model}`).catch((err) => {
                expect(err).toBeTruthy();
            });
        })

        test("Carrello vuoto o non esistente", async () => {
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5);
        
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUser;
                next();
            });
        
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                next();
            });
        
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);
            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(undefined as any); // No cart
        
            const response = await request(app).delete(baseURL + "/products/" + product.model);
            expect(response.status).toBe(404); // Expect 400 for empty or non-existing cart
            expect(response.body).toEqual({ error: new CartNotFoundError().customMessage });
        });
        

        test("Prodotto non presente nel carrello", async () => {
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5);
        
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
        
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                req.user = testUser;
                next();
            });
        
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => {
                next();
            });
        
            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);
            const new_cart = new Cart("username", false, "paymentDate", 1, [new ProductInCart("non_modello", 1, Category.SMARTPHONE, 5)]);
            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(new_cart);
        
            const mockRemoveProductFromCart = jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());
            const response = await request(app).delete(baseURL + "/products/" + product.model);
            
            expect(response.status).toBe(404); // Update to match the 404 status for product not in cart
            expect(response.body).toEqual({ error: new ProductNotInCartError().customMessage });
        });
        

        test("Errore nella verifica prodotto nel carrello", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product]);
            
            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error());

            const response = await request(app).delete(baseURL + "/products" +`/${product.model}`).catch((err) => {
                expect(err).toBeTruthy();
            });
        })



    });

    describe("Svuotare il carrello", ()=>{
        test("Funzionamento corretto", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(fullcart);
            const mockClearCart = jest.spyOn(CartController.prototype, "clearCart").mockResolvedValueOnce(true);
            const response = await request(app).delete(baseURL + "/current");
            expect(response.status).toBe(200);
            expect(mockClearCart).toHaveBeenCalledTimes(1);
        });

        test("Errore nel controller", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });

            const mockClearCart = jest.spyOn(CartController.prototype, "clearCart").mockRejectedValue(new Error());
            const response = await request(app).delete(baseURL + "/current").catch((err) => {
                expect(err).toBeTruthy();
            });
            
        })

        test("Carrello vuoto o non esistente", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            const product = new Product(10, "model", Category.SMARTPHONE, "arrivalDate", "details", 5)
            const productInCart = new ProductInCart(product.model, product.quantity, product.category, product.sellingPrice)
            const newCart = new Cart("username", false, "paymentDate", 1, [productInCart]);
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
    
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });
    
            const mockIsCustomer = jest.spyOn(Authenticator.prototype, "isCustomer");
            mockIsCustomer.mockImplementation((req, res, next) => {
                return next();
            });
    
            const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(newCart);
    
            const mockClearCart = jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new EmptyCartError());
            const response = await request(app).delete(baseURL + "/current");
            expect(response.status).toBe(400);
            expect(response.body).toEqual({"error":new EmptyCartError().customMessage, "status": 400})
        })
        
    });

    describe("Rimuovere tutti i carrelli", ()=>{

        test("Funzionamento corretto", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockClearAllCarts = jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValueOnce(true);
            const response = await request(app).delete(baseURL);
            expect(response.status).toBe(200);
            expect(mockClearAllCarts).toHaveBeenCalledTimes(1);
        });

        test("Errore nel controller", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockClearAllCarts = jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValue(new Error());
            const response = await request(app).delete(baseURL).catch((err) => {
                expect(err).toBeTruthy();
            });
        });
    })

    describe("Ottieni tutti i carrelli", ()=>{
        test("Funzionamento corretto", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetAllCarts = jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValueOnce([cart]);
            const response = await request(app).get(baseURL +"/all");
            expect(response.status).toBe(200);
            expect(response.body).toEqual([cart]);
            expect(mockGetAllCarts).toHaveBeenCalledTimes(1);
        })

        test("Errore Nel controller", async()=>{
            const testUser = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate")
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                req.user = testUser
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            const mockGetAllCarts = jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValue(new Error());
            const response = await request(app).get(baseURL +"/all").catch((err) => {
                expect(err).toBeTruthy();
            });
        
        })
    });



    

});



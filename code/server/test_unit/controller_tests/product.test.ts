import { test, expect, jest, describe, afterEach, beforeEach} from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import ProductDAO from "../../src/dao/productDAO"
import {Product, Category} from "../../src/components/product"
import { EmptyProductStockError, LowProductStockError, ProductAlreadyExistsError, ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/dao/productDAO")

describe("ProductController", () => {
    const productController = new ProductController()

    afterEach(() => {
        jest.clearAllMocks();
    })

    describe("RegisterProducts", () => {

        test("Corretto Inserimento Prodotto", async () => {
            const product = new Product(10, "model", Category.SMARTPHONE, "2024-05-12", "details", 1)
            const mockRegisterProducts= jest.spyOn(ProductDAO.prototype, "registerProducts")
            await expect(productController.registerProducts(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate))
            .resolves.not.toThrow()
            
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate)

            mockRegisterProducts.mockRestore()
        })        

        test("Parametri errati forniti", async () => {
            const product = {
                model: "model",
                category: "tablet",
                quantity: 1,
                details: "details",
                sellingPrice: 1,
                arrivalDate: "2024-05-12"
            }
            const mockRegisterProducts= jest.spyOn(ProductDAO.prototype, "registerProducts").mockRejectedValueOnce(new Error())
            await expect(productController.registerProducts(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate))
            .rejects.toThrow()
            
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate)

            mockRegisterProducts.mockRestore()
        })  

        test("Errore Modello già presente", async () => {
            const product = {
                model: "model",
                category: "tablet",
                quantity: 1,
                details: "details",
                sellingPrice: 1,
                arrivalDate: "2024-05-12"
            }
            const mockRegisterProducts= jest.spyOn(ProductDAO.prototype, "registerProducts").mockRejectedValueOnce(new ProductAlreadyExistsError())
            await expect(productController.registerProducts(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate))
            .rejects.toThrow(new ProductAlreadyExistsError())
            
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.registerProducts).toHaveBeenCalledWith(product.model, product.category, product.quantity, product.details, product.sellingPrice, product.arrivalDate)

            mockRegisterProducts.mockRestore()
        })  

    });

    describe("ChangeProductQuantity", () => {

        test("Parametri errati forniti", async () => {
            const model = "model"
            const newQuantity = 1
            const changeDate = "2024-05-12"
            const mockChangeProductQuantity= jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockRejectedValueOnce(new Error())
            await expect(productController.changeProductQuantity(model, newQuantity, changeDate))
            .rejects.toThrow()
            
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, changeDate)

            mockChangeProductQuantity.mockRestore()
        })

        test("Modello non esistente", async () => {
            const model = "model"
            const newQuantity = 1
            const changeDate = "2024-05-12"
            const mockChangeProductQuantity= jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockRejectedValueOnce(new ProductNotFoundError())
            await expect(productController.changeProductQuantity(model, newQuantity, changeDate))
            .rejects.toThrow(new ProductNotFoundError())
            
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, changeDate)

            mockChangeProductQuantity.mockRestore()
        })

        test("Corretta Modifica Quantità Prodotto", async () => {
            const model = "model"
            const newQuantity = 1
            const changeDate = "2024-05-12"
            const mockChangeProductQuantity= jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValueOnce(10)
            await expect(productController.changeProductQuantity(model, newQuantity, changeDate))
            .resolves.toEqual(10)
            
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.changeProductQuantity).toHaveBeenCalledWith(model, newQuantity, changeDate)

            mockChangeProductQuantity.mockRestore()
        })        

         
    });

    describe("SellProduct", () => {
            
            test("Parametri errati forniti", async () => {
                const model = "model"
                const quantity = 1
                const sellingDate = "2024-05-12"
                const mockSellProduct= jest.spyOn(ProductDAO.prototype, "sellProduct").mockRejectedValueOnce(new Error())
                await expect(productController.sellProduct(model, quantity, sellingDate))
                .rejects.toThrow()
                
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate)
    
                mockSellProduct.mockRestore()
            })

            test("Modello non esistente", async () => {
                const model = "model"
                const quantity = 1
                const sellingDate = "2024-05-12"
                const mockSellProduct= jest.spyOn(ProductDAO.prototype, "sellProduct").mockRejectedValueOnce(new ProductNotFoundError())
                await expect(productController.sellProduct(model, quantity, sellingDate))
                .rejects.toThrow(new ProductNotFoundError())
                
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate)
    
                mockSellProduct.mockRestore()
            })

            test("Quantità non deve essere nulla", async () => {
                const model = "model"
                const quantity = 1
                const sellingDate = "2024-05-12"
                const mockSellProduct= jest.spyOn(ProductDAO.prototype, "sellProduct").mockRejectedValueOnce(new EmptyProductStockError())
                await expect(productController.sellProduct(model, quantity, sellingDate))
                .rejects.toThrow(new EmptyProductStockError())
                
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate)
    
                mockSellProduct.mockRestore()
            })

            test("Quantità venduta maggiore della quantità disponibile", async () => {
                const model = "model"
                const quantity = 1
                const sellingDate = "2024-05-12"
                const mockSellProduct= jest.spyOn(ProductDAO.prototype, "sellProduct").mockRejectedValueOnce(new LowProductStockError())
                await expect(productController.sellProduct(model, quantity, sellingDate))
                .rejects.toThrow(new LowProductStockError())
                
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate)
    
                mockSellProduct.mockRestore()
            })
    
            test("Corretta Vendita Prodotto", async () => {
                const model = "model"
                const quantity = 1
                const sellingDate = "2024-05-12"
                const mockSellProduct= jest.spyOn(ProductDAO.prototype, "sellProduct").mockResolvedValueOnce(10)
                await expect(productController.sellProduct(model, quantity, sellingDate))
                .resolves.toEqual(10)
                
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.sellProduct).toHaveBeenCalledWith(model, quantity, sellingDate)
    
                mockSellProduct.mockRestore()
            })        
    });

    describe("GetProducts", () => {
                
            test("Parametri errati forniti", async () => {
                const grouping: string|null = "model"
                const category: string|null = "tablet"
                const model: string|null = "model"
                const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(new Error())
                await expect(productController.getProducts(grouping, category, model))
                .rejects.toThrow()
                
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(grouping, category, model)
    
                mockGetProducts.mockRestore()
            })

            test("Modello non esistente", async () => {
                const grouping: string|null = "model"
                const category: string|null = "tablet"
                const model: string|null = "model"
                const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getProducts").mockRejectedValueOnce(new ProductNotFoundError())
                await expect(productController.getProducts(grouping, category, model))
                .rejects.toThrow(new ProductNotFoundError())
                
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(grouping, category, model)
    
                mockGetProducts.mockRestore()
            })
    
            test("Filtro per categoria", async () => {
                const grouping: string|null = "category"
                const category: string|null = Category.SMARTPHONE
                const model: string|null = null
                
                const product = {
                    model: "model",
                    category: Category.SMARTPHONE,
                    quantity: 1,
                    details: "details",
                    sellingPrice: 1,
                    arrivalDate: "2024-05-12"
                }

                const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product])
                await expect(productController.getProducts(grouping, category, model))
                .resolves.toEqual([product])
                
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(grouping, category, model)
    
                mockGetProducts.mockRestore()
            })  
            
            test("Corretto Recupero Prodotti", async () => {
                const grouping: string|null = "model"
                const category: string|null = null
                const model: string|null = "Iphone11"
                
                const product = {
                    model: "Iphone11",
                    category: Category.SMARTPHONE,
                    quantity: 1,
                    details: "details",
                    sellingPrice: 1,
                    arrivalDate: "2024-05-12"
                }
                const mockGetProductsCheck= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product])
                const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product])
                await expect(productController.getProducts(grouping, category, model))
                .resolves.toEqual([product])
                
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(2)
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(grouping, category, model)
    
                mockGetProducts.mockRestore()
                mockGetProductsCheck.mockRestore()
            })   
            test("Corretto Recupero Prodotti", async () => {
                const grouping: string|null = null
                const category: string|null = null
                const model: string|null = null
                
                const product = {
                    model: "model",
                    category: Category.SMARTPHONE,
                    quantity: 1,
                    details: "details",
                    sellingPrice: 1,
                    arrivalDate: "2024-05-12"
                }

                const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product])
                await expect(productController.getProducts(grouping, category, model))
                .resolves.toEqual([product])
                
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledTimes(1)
                expect(ProductDAO.prototype.getProducts).toHaveBeenCalledWith(grouping, category, model)
    
                mockGetProducts.mockRestore()
            })   

    });

    describe("GetAvailableProducts", () => {
                
        test("Parametri errati forniti", async () => {
            const grouping: string|null = "model"
            const category: string|null = "tablet"
            const model: string|null = "model"
            const product = {
                model: "model",
                category: Category.SMARTPHONE,
                quantity: 1,
                details: "details",
                sellingPrice: 1,
                arrivalDate: "2024-05-12"
            }
             const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product])
            const mockGetAvailableProducts= jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([])
            await expect(productController.getAvailableProducts(grouping, category, model))
            .resolves.toEqual([])
            
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, category, model)

            mockGetProducts.mockRestore()
            mockGetAvailableProducts.mockRestore()
        })

        test("Modello non esistente", async () => {
            const grouping: string|null = "model"
            const category: string|null = "tablet"
            const model: string|null = "model"

            const mockGetProductsCheck= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([])
            const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockRejectedValueOnce(new ProductNotFoundError())
            await expect(productController.getAvailableProducts(grouping, category, model))
            .rejects.toThrow(new ProductNotFoundError())
            
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(0)

            mockGetProducts.mockRestore()
            mockGetProductsCheck.mockRestore()
        })

        test("Filtro per categoria", async () => {
            const grouping: string|null = "category"
            const category: string|null = Category.SMARTPHONE
            const model: string|null = null
            
            const product = {
                model: "model",
                category: Category.SMARTPHONE,
                quantity: 1,
                details: "details",
                sellingPrice: 1,
                arrivalDate: "2024-05-12"
            }

            const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([product])
            await expect(productController.getAvailableProducts(grouping, category, model))
            .resolves.toEqual([product])
            
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, category, model)

            mockGetProducts.mockRestore()
        })  
        
        test("Corretto Recupero Prodotti", async () => {
            const grouping: string|null = "model"
            const category: string|null = null
            const model: string|null = "Iphone11"
            
            const product = {
                model: "model",
                category: Category.SMARTPHONE,
                quantity: 1,
                details: "details",
                sellingPrice: 1,
                arrivalDate: "2024-05-12"
            }

            const mockGetProductsCheck= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product])
            const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([product])
            await expect(productController.getAvailableProducts(grouping, category, model))
            .resolves.toEqual([product])
            
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, category, model)

            mockGetProducts.mockRestore()
            mockGetProductsCheck.mockRestore()
        })   
        test("Corretto Recupero Prodotti", async () => {
            const grouping: string|null = null
            const category: string|null = null
            const model: string|null = null
            
            const product = {
                model: "Iphone11",
                category: Category.SMARTPHONE,
                quantity: 1,
                details: "details",
                sellingPrice: 1,
                arrivalDate: "2024-05-12"
            }

            const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getAvailableProducts").mockResolvedValueOnce([product])
            await expect(productController.getAvailableProducts(grouping, category, model))
            .resolves.toEqual([product])
            
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, category, model)

            mockGetProducts.mockRestore()
        })   

    });

    describe("DeleteAllProducts", () => {
                    
            test("Corretta Eliminazione Prodotti", async () => {
                const mockDeleteAllProducts= jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockResolvedValueOnce(true)
                await expect(productController.deleteAllProducts())
                .resolves.toEqual(true)
                
                expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)
    
                mockDeleteAllProducts.mockRestore()
            })   

            test("Errore nella cancellazione", async() =>{
                const mockDeleteAllProducts= jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockRejectedValueOnce(false)
                await expect(productController.deleteAllProducts())
                .rejects.toBe(false)
                
                expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)
    
                mockDeleteAllProducts.mockRestore()
            })

            test("Cancellazione Prodotti da Carrello vuoto", async()=>{
                const mockDeleteAllProducts= jest.spyOn(ProductDAO.prototype, "deleteAllProducts").mockRejectedValueOnce(new EmptyProductStockError())
                await expect(productController.deleteAllProducts())
                .rejects.toThrow(new EmptyProductStockError())
                
                expect(ProductDAO.prototype.deleteAllProducts).toHaveBeenCalledTimes(1)
    
                mockDeleteAllProducts.mockRestore()
            })
    });

    describe("Delete a Product", () => {
                    
        test("Corretta Eliminazione Prodotto", async () => {
            const mockDeleteAllProducts= jest.spyOn(ProductDAO.prototype, "deleteProduct").mockResolvedValueOnce(true)
            await expect(productController.deleteProduct("model"))
            .resolves.toEqual(true)
            
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1)

            mockDeleteAllProducts.mockRestore()
        })   

        test("Errore nella cancellazione", async() =>{
            const mockDeleteAllProducts= jest.spyOn(ProductDAO.prototype, "deleteProduct").mockRejectedValueOnce(false)
            await expect(productController.deleteProduct("model"))
            .rejects.toBe(false)
            
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1)

            mockDeleteAllProducts.mockRestore()
        })

        test("Cancellazione Prodotti da Carrello vuoto", async()=>{
            const mockDeleteAllProducts= jest.spyOn(ProductDAO.prototype, "deleteProduct").mockRejectedValueOnce(new EmptyProductStockError())
            await expect(productController.deleteProduct("model"))
            .rejects.toThrow(new EmptyProductStockError())
            
            expect(ProductDAO.prototype.deleteProduct).toHaveBeenCalledTimes(1)

            mockDeleteAllProducts.mockRestore()
        })
});








})
import { test, expect, jest, describe, afterEach, beforeEach} from "@jest/globals"
import CartController from "../../src/controllers/cartController"
import CartDAO from "../../src/dao/cartDAO"
import ProductDAO from "../../src/dao/productDAO";
import { Cart, ProductInCart } from "../../src/components/cart"
import { User, Role} from "../../src/components/user"
import {Product, Category} from "../../src/components/product"
import * as cartErrors from "../../src/errors/cartError"
import { LowProductStockError, ProductNotFoundError } from "../../src/errors/productError";

jest.mock("../../src/dao/cartDAO")
jest.mock("../../src/dao/productDAO")

describe('CartController.addToCart', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });
    const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");

    test("It should increment the quantity of an existing product in the cart", async () => {
        const product = "testProduct";
        const new_product = new ProductInCart(product, 1, Category.SMARTPHONE, 100);
        const cart = new Cart(user.username, false, "", 0, [new_product]);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockChangeProductNumberInCart = jest.spyOn(CartDAO.prototype, "changeProductNumberInCart").mockResolvedValue(true);
        const mockUpdateTotalCart = jest.spyOn(CartDAO.prototype, "updateTotalCart").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.addToCart(user, product)).resolves.toBe(true);

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);


    });

    test("It should insert a new product in an existing cart", async () => {
        const product = "testProduct";
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart("New_product", 1, Category.SMARTPHONE, 100)]);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockManageProductToCart = jest.spyOn(CartDAO.prototype, "ManageProductToCart").mockResolvedValue(true);
        const mockUpdateTotalCart = jest.spyOn(CartDAO.prototype, "updateTotalCart").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.addToCart(user, product)).resolves.toBe(true);

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockManageProductToCart).toHaveBeenCalledTimes(1);
        expect(mockManageProductToCart).toHaveBeenCalledWith(product, 1, "insert");

    });

    test("It should insert a new product in an empty cart", async () => {
        const product = "testProduct";
        const new_product = new ProductInCart(product, 1, Category.SMARTPHONE, 100);
        const cart = new Cart(user.username, false, "", 0, [new_product]);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockRejectedValue(new cartErrors.CartNotFoundError());
        const mockGetEmptyCart = jest.spyOn(CartDAO.prototype, "getEmptyCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockChangeProductNumberInCart = jest.spyOn(CartDAO.prototype, "changeProductNumberInCart").mockResolvedValue(true);
        const mockUpdateTotalCart = jest.spyOn(CartDAO.prototype, "updateTotalCart").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.addToCart(user, product)).resolves.toBe(true);

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
    });

    test("It should create a new cart if there is no current cart", async () => {
        const product = new Product(100, "testProduct", Category.SMARTPHONE, "2024-05-12", "details", 5);
        const new_product = new ProductInCart(product.model, 1, Category.SMARTPHONE, 100);
        const cart = new Cart(user.username, false, "", 0, [new_product]);
        
        const mockGetProducts= jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValueOnce([product])
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockRejectedValue(new cartErrors.CartNotFoundError());
        const mockGetEmptyCart = jest.spyOn(CartDAO.prototype, "getEmptyCart").mockRejectedValue(new cartErrors.CartNotFoundError());
        const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.addToCart(user, product.model)).resolves.toBe(true);

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockGetEmptyCart).toHaveBeenCalledTimes(1);
        expect(mockCreateCart).toHaveBeenCalledTimes(1);
    })

    test("It should throw an error if the quantity is not updated", async () => {
        const product = "testProduct";
        const new_product = new ProductInCart(product, 1, Category.SMARTPHONE, 100);
        const cart = new Cart(user.username, false, "", 0, [new_product]);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockChangeProductNumberInCart = jest.spyOn(CartDAO.prototype, "changeProductNumberInCart")
            .mockRejectedValue(new Error("Quantity not updated"));

        const cartController = new CartController();

        await expect(cartController.addToCart(user, product)).rejects.toThrow("Quantity not updated");

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockChangeProductNumberInCart).toHaveBeenCalledTimes(1);
    });

    test("Error in cart creation", async()=>{
        const product = "testProduct";
        const new_product = new ProductInCart(product, 1, Category.SMARTPHONE, 100);
        const cart = new Cart(user.username, false, "", 0, [new_product]);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockRejectedValue(new cartErrors.CartNotFoundError());
        const mockGetEmptyCart = jest.spyOn(CartDAO.prototype, "getEmptyCart").mockRejectedValue(new cartErrors.CartNotFoundError());
        const mockCreateCart = jest.spyOn(CartDAO.prototype, "createCart").mockRejectedValue(new Error(""));

        const cartController = new CartController();

        await expect(cartController.addToCart(user, product)).rejects.toThrow("");

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockGetEmptyCart).toHaveBeenCalledTimes(1);
        expect(mockCreateCart).toHaveBeenCalledTimes(0);
    }); 
});
//----------------------------------------------------------
describe('CartController.getCart', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });
    const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");

    test("It should retrieve the user's cart", async () => {
        const cart = new Cart(user.username, false, "", 0, []);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);

        const cartController = new CartController();

        await expect(cartController.getCart(user)).resolves.toBe(cart);

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockGetUnpaidCart).toHaveBeenCalledWith(user);

    });

    test("It should return an empty cart if the user has no current cart", async () => {
        const cart = new Cart(user.username, false, "", 0, []);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockRejectedValue(new cartErrors.CartNotFoundError());
        const mockCreateEmptyCart = jest.spyOn(CartDAO.prototype, "createEmptyCart").mockResolvedValue(cart);
        const cartController = new CartController();

        await expect(cartController.getCart(user)).resolves.toEqual(new Cart(user.username, false, "", 0, []));

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockGetUnpaidCart).toHaveBeenCalledWith(user);
    })
});

describe('CartController.checkoutCart', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });

    test("It should checkout the user's cart", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart("testProduct", 1, Category.SMARTPHONE, 10)]);
        
        const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(cart);
        const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([new Product(100, "testProduct", Category.SMARTPHONE, "2024-05-12", "details", 5)]);
        const mockChangeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue(5);
        const mockCheckOutCart = jest.spyOn(CartDAO.prototype, "checkoutCart").mockResolvedValue(true);
        const cartController = new CartController();

    
    
        await expect(cartController.checkoutCart(user)).resolves.toBe(true);
    
        expect(mockGetCart).toHaveBeenCalledWith(user);
        expect(mockGetProducts).toHaveBeenCalledTimes(1);
        expect(mockGetProducts).toHaveBeenCalledWith("model", null, "testProduct");
        expect(mockChangeProductQuantity).toHaveBeenCalledTimes(1);
    
    });
        
    test("It should throw an error if a product is not available in the required quantity", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart("testProduct", 2, Category.SMARTPHONE, 100)]);
        
        const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(cart);
        const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([new Product(100, "testProduct", Category.SMARTPHONE, "2024-05-12", "details", 1)]);
    
        const cartController = new CartController();
    
        await expect(cartController.checkoutCart(user)).rejects.toThrowError(LowProductStockError);
    
        expect(mockGetCart).toHaveBeenCalledWith(user);
        expect(mockGetProducts).toHaveBeenCalledTimes(1);    
    });

    test("It should throw an error if the quantity is not updated", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart("testProduct", 1, Category.SMARTPHONE, 100)]);
        
        const cartController = new CartController();
        const mockGetCart = jest.spyOn(CartController.prototype, "getCart").mockResolvedValue(cart);
        const mockGetProducts = jest.spyOn(ProductDAO.prototype, "getProducts").mockResolvedValue([new Product(100, "testProduct", Category.SMARTPHONE, "2024-05-12", "details", 5)]);
        const mockChangeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")
         .mockImplementationOnce(() => Promise.reject(new ProductNotFoundError()));

    
        await expect(cartController.checkoutCart(user)).rejects.toThrow("Quantity not updated");
    
        expect(mockGetCart).toHaveBeenCalledWith(user);
        expect(mockGetProducts).toHaveBeenCalledTimes(1);
        expect(mockGetProducts).toHaveBeenCalledWith("model", null, "testProduct");
        expect(mockChangeProductQuantity).toHaveBeenCalledTimes(1);
    });

    test("It should throw CartNotFoundError if the cart is not found", async () => {
        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart("testProduct", 1, Category.SMARTPHONE, 100)]);

        const mockGetCartController = jest.spyOn(CartController.prototype, "getCart").mockRejectedValue(new cartErrors.EmptyCartError());
  

        const cartController = new CartController();

        await expect(cartController.checkoutCart(user)).rejects.toThrow(new cartErrors.EmptyCartError());

        expect(mockGetCartController).toHaveBeenCalledWith(user);
    });


});

describe('CartController.getCustomerCarts', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });

    const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");

    test("It should retrieve the customer's paid carts", async () => {
        const carts = [
            new Cart(user.username, true, "2024-06-01", 100, [new ProductInCart("testProduct1", 1, Category.SMARTPHONE, 100)]),
            new Cart(user.username, true, "2024-05-30", 200, [new ProductInCart("testProduct2", 2, Category.LAPTOP, 150)]),
        ];

        const mockGetPaidCart = jest.spyOn(CartDAO.prototype, "getPaidCart").mockResolvedValue(carts);

        const cartController = new CartController();

        await expect(cartController.getCustomerCarts(user)).resolves.toEqual(carts);

        expect(mockGetPaidCart).toHaveBeenCalledTimes(1);
        expect(mockGetPaidCart).toHaveBeenCalledWith(user);
    });
});

describe('CartController.removeProductFromCart', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");
    const product = "testProduct";

    test("It should remove one product unit from the current cart", async () => {
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart(product, 2, Category.SMARTPHONE, 100)]);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockChangeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue(5);
        const mockChangeProductNumberInCart = jest.spyOn(CartDAO.prototype, "changeProductNumberInCart").mockResolvedValue(true);
        const mockUpdateTotalCart = jest.spyOn(CartDAO.prototype, "updateTotalCart").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.removeProductFromCart(user, product)).resolves.toBe(true);

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockChangeProductNumberInCart).toHaveBeenCalledTimes(1);
        expect(mockChangeProductNumberInCart).toHaveBeenCalledWith(product,1, "decrement");
    });

    test("It should delete the product if there's only one unit in the cart", async () => {
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart(product, 1, Category.SMARTPHONE, 100)]);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockManageProductToCart = jest.spyOn(CartDAO.prototype, "ManageProductToCart").mockResolvedValue(true);
        const mockChangeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue(1);
        const mockUpdateTotalCart = jest.spyOn(CartDAO.prototype, "updateTotalCart").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.removeProductFromCart(user, product)).resolves.toBe(true);

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
        expect(mockManageProductToCart).toHaveBeenCalledTimes(1);
        expect(mockManageProductToCart).toHaveBeenCalledWith(product,1, "delete");
   
    });

    test("It should return error if the product is not in the cart", async () => {
        const cart = new Cart(user.username, false, "", 0, []);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const cartController = new CartController();

        await expect(cartController.removeProductFromCart(user, product)).rejects.toThrow(new cartErrors.EmptyCartError());

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
    });

    test("It should throw an error if the cart doens't exist", async()=>{
        const cart = new Cart(user.username, false, "", 0, []);
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockRejectedValue(new cartErrors.CartNotFoundError());
        const cartController = new CartController();

        await expect(cartController.removeProductFromCart(user, product)).rejects.toThrow(new cartErrors.CartNotFoundError());

        expect(mockGetUnpaidCart).toHaveBeenCalledTimes(1);
    })

});

describe('CartController.clearCart', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });

    const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Via Rossi 123", "2004-04-24");

    test("It should clear the user's cart", async () => {
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart("testProduct", 1, Category.SMARTPHONE, 100)]);

        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockChangeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity").mockResolvedValue(1);
        const mockClearUnpaidCart = jest.spyOn(CartDAO.prototype, "clearUnpaidCart").mockResolvedValue(true);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockUpdateTotalCart = jest.spyOn(CartDAO.prototype, "updateTotalCart").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.clearCart(user)).resolves.toBe(true);

        expect(mockGetUnpaidCart).toHaveBeenCalledWith(user);
        expect(mockChangeProductQuantity).toHaveBeenCalledTimes(cart.products.length);

        expect(mockClearUnpaidCart).toHaveBeenCalledWith(1);
    });

    test("It should return the error if the unpaid cart is not found", async () => {
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockRejectedValue(new cartErrors.CartNotFoundError());
    });

    test("It should throw an error if the quantity is not updated", async () => {
        const cart = new Cart(user.username, false, "", 0, [new ProductInCart("testProduct", 1, Category.SMARTPHONE, 100)]);
    
        const mockGetUnpaidCart = jest.spyOn(CartDAO.prototype, "getUnpaidCart").mockResolvedValue(cart);
        const mockGetUnpaidCartID = jest.spyOn(CartDAO.prototype, "getUnpaidCartId").mockResolvedValue(1);
        const mockChangeProductQuantity = jest.spyOn(ProductDAO.prototype, "changeProductQuantity")
            .mockRejectedValue(new Error("Quantity not updated"));
    
        const cartController = new CartController();
    
        await expect(cartController.clearCart(user)).rejects.toThrow("Quantity not updated");
    
        expect(mockGetUnpaidCart).toHaveBeenCalledWith(user);
        expect(mockChangeProductQuantity).toHaveBeenCalledTimes(cart.products.length);
    });
});
describe('CartControllers.deleteAllCarts', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });
    test("It should delete all carts", async () => {
        const mockDeleteAllCarts = jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockResolvedValue(true);

        const cartController = new CartController();

        await expect(cartController.deleteAllCarts()).resolves.toBe(true);

        expect(mockDeleteAllCarts).toHaveBeenCalledTimes(1);
    });

    test("It should handle errors", async () => {
        const mockDeleteAllCarts = jest.spyOn(CartDAO.prototype, "deleteAllCarts").mockRejectedValue(new Error("Failed to delete all carts"));

        const cartController = new CartController();

        await expect(cartController.deleteAllCarts()).rejects.toThrow("Failed to delete all carts");

        expect(mockDeleteAllCarts).toHaveBeenCalledTimes(1);
    });
});

describe('CartControllers.getAllCarts', () => {
    afterEach(() => {
        jest.clearAllMocks(); 
    });
    test("It should retrieve all carts", async () => {
        const carts = [
            new Cart("user1", true, "2024-05-01", 100, []),
            new Cart("user2", false, "", 0, [])
        ];
        const mockGetAllCarts = jest.spyOn(CartDAO.prototype, "getAllCarts").mockResolvedValue(carts);

        const cartController = new CartController();

        await expect(cartController.getAllCarts()).resolves.toEqual(carts);

        expect(mockGetAllCarts).toHaveBeenCalledTimes(1);
    });

    test("It should handle errors", async () => {
        const mockGetAllCarts = jest.spyOn(CartDAO.prototype, "getAllCarts").mockRejectedValue(new Error("Failed to retrieve all carts"));

        const cartController = new CartController();

        await expect(cartController.getAllCarts()).rejects.toThrow("Failed to retrieve all carts");

        expect(mockGetAllCarts).toHaveBeenCalledTimes(1);
    });
});
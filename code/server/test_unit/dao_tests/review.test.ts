import { describe, test, expect, beforeAll, afterAll, jest , beforeEach} from "@jest/globals"
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { User, Role } from "../../src/components/user"
import { ProductReview } from "../../src/components/review"
import { NoReviewProductError } from "../../src/errors/reviewError"

describe("addReview DAO test", () => {
    const reviewDAO = new ReviewDAO();
    const user = new User("username", "name", "surname", Role.MANAGER, "address", "2000-01-01");

    test("aggiunta recensione con successo", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(null);
            return {} as any;
        });

        await expect(reviewDAO.addReview("model", user, 5, "Great product")).resolves.toBeUndefined();

        mockDBRun.mockRestore();
    });

    test("errore durante l'aggiunta della recensione", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"));
            return {} as any;
        });

        await expect(reviewDAO.addReview("model", user, 5, "Great product")).rejects.toThrow("Database error");

        mockDBRun.mockRestore();
    });

    
});


describe("getProductReviews DAO test", () => {
    const reviewDAO = new ReviewDAO();

    test("recensioni trovate con successo", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [
                { model: "model", user: "username1", score: 5, date: "2023-01-01", comment: "Great product" },
                { model: "model", user: "username2", score: 4, date: "2023-01-02", comment: "Good product" }
            ]);
            return {} as any;
        });

        await expect(reviewDAO.getProductReviews("model")).resolves.toEqual( [
            { model: "model", user: "username1", score: 5, date: "2023-01-01", comment: "Great product" },
            { model: "model", user: "username2", score: 4, date: "2023-01-02", comment: "Good product" }
        ]);

        mockDBAll.mockRestore();
    });

    test("nessuna recensione trovata", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, {length: 0});
            return {} as any;
        });

        await expect(reviewDAO.getProductReviews("model")).resolves.toEqual([]);

        mockDBAll.mockRestore();
    });

    test("errore recensioni", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error());
            return {} as any;
        });

        await expect(reviewDAO.getProductReviews("model")).rejects.toThrow(Error);

        mockDBAll.mockRestore();
    });
});

describe("getUserReview DAO test", () => {
    const reviewDAO = new ReviewDAO();
    const user = new User("username", "name", "surname",  Role.CUSTOMER, "address", "2000-01-01");

    test("recensione utente trovata", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, [{ model: "model", user: "username" }]);
            return {} as any;
        });

        await expect(reviewDAO.getUserReview(user, "model")).resolves.toBe(true);

        mockDBAll.mockRestore();
    });

    test("nessuna recensione utente trovata", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(null, []);
            return {} as any;
        });

        await expect(reviewDAO.getUserReview(user, "model")).resolves.toBe(false);

        mockDBAll.mockRestore();
    });
    
    test("Errore database", async () => {
        const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
            callback(new Error());
            return {} as any;
        });

        await expect(reviewDAO.getUserReview(user, "model")).rejects.toThrow(Error);

        mockDBAll.mockRestore();
    });
});


describe("ReviewDAO deleteReview Tests", () => {
    const reviewDAO = new ReviewDAO();

    test("recensione eliminata correttamente", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call( { changes: 1 }, null);
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Test Address", "2022-01-01");
        await expect(reviewDAO.deleteReview("testModel", user)).resolves.toBeUndefined();

        mockDBRun.mockRestore();
    });

    test("nessuna recensione trovata", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call( { changes: 0 }, null); 
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Test Address", "2022-01-01");
        await expect(reviewDAO.deleteReview("testModel", user)).rejects.toThrow(new NoReviewProductError());

        mockDBRun.mockRestore();
    });

    test("Errore del database", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null); // Simula un errore del database
            return {} as any;
        });

        const user = new User("testUser", "Test", "User", Role.CUSTOMER, "Test Address", "2022-01-01");
        await expect(reviewDAO.deleteReview("testModel", user)).rejects.toThrow("Database error");

        mockDBRun.mockRestore();
    });
});
describe("ReviewDAO deleteReviewsOfProduct Tests", () => {
    const reviewDAO = new ReviewDAO();

    test("recensioni del prodotto elminate correttamente", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call( { changes: 1 }, null); 
            return {} as any;
        });

        await expect(reviewDAO.deleteReviewsOfProduct("testModel")).resolves.toBeUndefined();

        mockDBRun.mockRestore();
    });

    test("recensioni per il prodotto non trovate", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback.call( { changes: 0 }, null); 
            return {} as any;
        });

        await expect(reviewDAO.deleteReviewsOfProduct("testModel")).rejects.toThrow(new NoReviewProductError());

        mockDBRun.mockRestore();
    });

    test("Should throw an error if the database operation fails", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
            callback(new Error("Database error"), null); // Simula un errore del database
            return {} as any;
        });

        await expect(reviewDAO.deleteReviewsOfProduct("testModel")).rejects.toThrow("Database error");

        mockDBRun.mockRestore();
    });
});
describe("ReviewDAO deleteAllReviews Tests", () => {
    const reviewDAO = new ReviewDAO();

    test("recensioni eliminate correttamente ", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback.call( { changes: 1 }, null); 
            return {} as any;
        });

        await expect(reviewDAO.deleteAllReviews()).resolves.toBeUndefined();

        mockDBRun.mockRestore();
    });

    test("Should throw an error if the database operation fails", async () => {
        const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, callback) => {
            callback(new Error("Database error"), null);
            return {} as any;
        });

        await expect(reviewDAO.deleteAllReviews()).rejects.toThrow("Database error");

        mockDBRun.mockRestore();
    });
});
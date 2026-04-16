import e from "express";

export let users = [
    {
        id: "1",
        name: "Admin User",
        email: "admin@test.com",
        role: "admin",
        blocked: false
    },
    {
        id: "2",
        name: "Provider One",
        email: "provider@test.com",
        role: "provider",
        blocked: false

    }
];


export let opportunities = [
    {
        id: "101",
        title: "Software Engineer Internship",
        ProviderId: "2",
        status: "approved"
    },

    {
        id: "102",
        title: "Marketing Learnership",
        providerId: "2",
        status: "pending"
    },
];
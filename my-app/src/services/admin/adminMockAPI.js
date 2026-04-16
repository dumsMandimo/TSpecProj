import { users, opportunities } from "./mockData";

//get all opportunities

export const getAllOpportunities = () => {
    return opportunities;
};

//approve opportunity

export const approveOpportunity = (id) => {
    const opportunity = opportunities.find(opp => opp.id === id);
    if (opportunity) {
        opportunity.status = "approved";
        return opportunity;
    }   
};

//reject opportunity
export const rejectOpportunity = (id) => {
    const opportunity = opportunities.find(opp => opp.id === id);
    if (opportunity) {
        opportunity.status = "rejected";
        return opportunity;
    }
};

//delete opportunity
export const deleteOpportunity = (id) => {
    const index = opportunities.findIndex(opp => opp.id === id);
    if (index !== -1) {
        opportunities.splice(index, 1);
    }
    return { message: "Opportunity deleted" };
};

//block user
export const blockUser = (id) => {
    const user = users.find(u => u.id === id);
    if (user) {
        user.blocked = true;
        return user;
    }
};

//get all users
export const getAllUsers = () => {
    return users;
};



import axios from "axios";

export const fetchInvestmentOdds = async () => {
    try {
        const response = await axios.get("/api/investment-odds");
        return response.data.odds;
    } catch (error) {
        console.error("Error fetching investment odds:", error);
        return null;
    }
};

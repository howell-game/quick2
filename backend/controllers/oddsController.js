const { Investment, Odds } = require("../models");
const { Op } = require("sequelize");

const calculateAndStoreOdds = async () => {
  try {
    const investments = await Investment.findAll({
      where: {
        status: {
          [Op.in]: ["active", "awaiting"]
        }
      }
    });

    if (!investments.length) return;

    // Group investments by category
    const categoryGroups = investments.reduce((acc, investment) => {
      if (!acc[investment.category]) acc[investment.category] = [];
      acc[investment.category].push(investment);
      return acc;
    }, {});

    for (const category in categoryGroups) {
      const total = categoryGroups[category].length;
      const supplyCount = categoryGroups[category].filter(i => i.choice === "Supply").length;
      const demandCount = total - supplyCount;

      const supplyOdds = Math.round((supplyCount / total) * 100);
      const demandOdds = Math.round((demandCount / total) * 100);

      // Store or update odds using Sequelize
      const [odds, created] = await Odds.findOrCreate({
        where: { category },
        defaults: { supplyOdds, demandOdds, updatedAt: new Date() },
      });

      if (!created) {
        // If already exists, update the record
        await odds.update({ supplyOdds, demandOdds, updatedAt: new Date() });
      }
    }

    console.log("Odds calculation completed.");
  } catch (error) {
    console.error("Error calculating odds:", error);
  }
};

module.exports = { calculateAndStoreOdds };

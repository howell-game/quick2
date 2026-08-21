<template>
  <div class="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
    <h2 class="text-2xl font-bold text-gray-800 mb-4">Selection Strategy Guide</h2>

    <div class="space-y-4 text-gray-700">
      <section class="bg-lightyellow p-4 rounded-md">
        <h3 class="text-lg font-semibold text-gray-900">1. Understanding ROI Metrics</h3>
        <p>
          Upon clicking "View Trend", a display of indicators are shown for each category. The **Mean ROI** represents the **average** return across completed trade selections,  
          while the **Max ROI** highlights the **highest possible return**  
          within a category. 
        </p>
        <p>
          The difference between these two values indicates **volatility**—a **small gap** suggests stability,  
          while a **large gap** may indicate potential risk or reward.
        </p>
      </section>

      <section class="bg-lightyellow p-4 rounded-md">
        <h3 class="text-lg font-semibold text-gray-900">2. Interpreting the Odds</h3>
        <p>
          The **odds** - written as percentages - represent the market’s expectation of an outcome.  
          - **Higher odds** indicate a lower perceived probability but a higher potential return.  
          - **Lower odds** indicate a higher perceived probability but a lower return.  
        </p>
        <p>
          A strategic approach involves balancing **ROI stability** with **odds potential**  
          to make an informed selection.
        </p>
      </section>

      <section class="bg-lightyellow p-4 rounded-md">
        <h3 class="text-lg font-semibold text-gray-900">3. Using Trendlines for Decision Making</h3>
        <p>
          The **trendline** provides insight into market behavior:  
          - **Uptrend (Green Line)** → Supply is increasing, favoring supply-based choices.  
          - **Downtrend (Red Line)** → Demand is increasing, favoring demand-based choices.  
          - **Sideways Movement** → No clear direction, use ROI stability and odds for guidance.  
        </p>
      </section>

      <section class="bg-lightyellow p-4 rounded-md">
        <h3 class="text-lg font-semibold text-gray-900">4. Combining Metrics for Smarter Selections</h3>
        <p>
          To optimize trade section decisions, consider the following approach:  
        </p>
        <ul class="list-disc list-inside">
          <li>
            If **Max EROI is significantly higher than Mean ROI**, the market is volatile—  
            it may be safer to choose **lower odds** to minimize risk.
          </li>
          <li>
            If **Max EROI is close to Mean ROI**, the market is stable—  
            selecting **higher odds** could be a viable opportunity.
          </li>
          <li>
            If the **trendline is in your favor**, you can take calculated risks with **higher odds**.
          </li>
          <li>
            If the **trendline moves against your choice**, it may be wise to opt for **lower odds**.
          </li>
           <li>
            Analysis must be completed within 5 minutes following the **Timeframe Countdown** as indicators reset every 5 minutes.

          </li>
        </ul>
      </section>

      <section class="bg-lightyellow p-4 rounded-md">
        <h3 class="text-lg font-semibold text-gray-900">5. Final Considerations</h3>
        <p>
          By combining these factors, you can make **data-driven** trade selection decisions  
          rather than relying solely on intuition.
        </p>
        <p>
          **Remember:** No strategy is foolproof. Always manage your risk based on your comfort level.
        </p>
      </section>
    </div>

    <!-- Disclaimer -->
    <div class="mt-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 rounded-lg">
      <p><strong>Disclaimer:</strong> This strategy guide is only a suggestion to help refine your trading views.  
        Market conditions fluctuate, and past performance does not guarantee future results.  
        trade responsibly.</p>
    </div>
  </div>
</template>

<style scoped>
.bg-lightyellow {
    border-top: 2px solid yellow; /* Subtle highlight */
  background-color:lightyellow;
  border-bottom: 2px solid yellow; /* Subtle highlight */
}
p {
  line-height: 1.6;
}
</style>

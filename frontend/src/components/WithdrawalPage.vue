<template>
  <div class="withdrawal-container" v-if="isLoggedIn">

    <h2>Withdraw Funds</h2>

    <!-- Transaction History -->
    <div class="transaction-button-container">
      <button class="button transaction" @click="navigateToTransaction">
        Transaction History
      </button>
    </div>

    <!-- Amount -->
    <div class="form-group">
      <label>Amount</label>
      <input
        type="number"
        v-model="amount"
        min="500"
        placeholder="Enter Amount"
      />
      <small v-if="amount && amount < 500" class="error">
        Minimum withdrawal is ₦500
      </small>
    </div>

    <!-- Bank -->
    <div class="form-group autocomplete">

      <label>Bank</label>

      <input
        type="text"
        v-model="bankSearch"
        placeholder="Type Bank Name..."
        @input="filterBanks"
        @focus="showSuggestions=true"
      />

      <div
        class="suggestions"
        v-if="showSuggestions && filteredBanks.length"
      >

        <div
          class="suggestion"
          v-for="bank in filteredBanks"
          :key="bank.code"
          @click="selectBank(bank)"
        >

          {{ bank.name }}

        </div>

      </div>

    </div>

    <!-- Account Number -->

    <div class="form-group">

      <label>Account Number</label>

      <input
        maxlength="10"
        v-model="accountNumber"
        placeholder="0123456789"
        @input="accountChanged"
      />

    </div>

    <!-- Resolve -->

    <button
      class="resolve-btn"
      @click="resolveAccount"
      :disabled="!canResolve"
    >

      {{ resolving ? "Resolving..." : "Resolve Account" }}

    </button>

    <!-- Account Name -->

    <div
      class="resolved-box"
      v-if="accountName"
    >

      <div class="success">

        ✓ Verified Account

      </div>

      <strong>

        {{ accountName }}

      </strong>

    </div>

    <!-- Withdraw -->

    <button
      class="withdraw-btn"
      @click="withdraw"
      :disabled="!canWithdraw"
    >

      {{ withdrawing ? "Processing..." : "Withdraw" }}

    </button>

    <!-- Message -->

    <div
      class="message"
      v-if="message"
      :class="{error:isError}"
    >

      {{ message }}

    </div>

  </div>

  <div v-else>

    Please login first.

  </div>

</template>

<script>
import axios from "axios";
import { mapGetters } from "vuex";

export default {

data(){

return{

amount:"",

banks:[],

filteredBanks:[],

bankSearch:"",

selectedBank:null,

showSuggestions:false,

accountNumber:"",

accountName:"",

resolving:false,

withdrawing:false,

message:"",

isError:false,

};

},

computed:{

...mapGetters([
"isLoggedIn",
"userId"
]),

canResolve(){

return(

this.selectedBank &&

this.accountNumber.length===10 &&

!this.resolving

);

},

canWithdraw(){

return(

this.amount>=500 &&

this.accountName &&

!this.withdrawing

);

}

},

mounted(){

this.loadBanks();

},

methods:{

async loadBanks(){

try{

const res=await axios.get(

`${import.meta.env.VITE_APP_BASE_URL}/api/transactions/banks`

);

this.banks=res.data;

this.filteredBanks=this.banks;

}

catch(err){

this.message="Unable to load banks.";

this.isError=true;

}

},

filterBanks(){

this.accountName="";

this.selectedBank=null;

const keyword=this.bankSearch.toLowerCase();

this.filteredBanks=this.banks.filter(

bank=>

bank.name.toLowerCase().includes(keyword)

);

},

selectBank(bank){

this.selectedBank=bank;

this.bankSearch=bank.name;

this.showSuggestions=false;

this.accountName="";

},

accountChanged(){

this.accountName="";

},

async resolveAccount(){

this.resolving=true;

this.message="";

this.isError=false;

try{

const res=await axios.post(

`${import.meta.env.VITE_APP_BASE_URL}/api/transactions/resolve-account`,

{

accountNumber:this.accountNumber,

bankCode:this.selectedBank.code,

}

);

this.accountName=res.data.accountName;

}

catch(err){

this.accountName="";

this.message=

err.response?.data?.error||

"Unable to resolve account.";

this.isError=true;

}

finally{

this.resolving=false;

}

},

async withdraw(){

this.withdrawing=true;

this.message="";

this.isError=false;

try{

const res=await axios.post(

`${import.meta.env.VITE_APP_BASE_URL}/api/transactions/withdraw`,

{

userId:this.userId,

amount:this.amount,

accountNumber:this.accountNumber,

bankCode:this.selectedBank.code,

}

);

this.message=

res.data.message||

"Withdrawal initiated successfully.";

this.resetForm();

}

catch(err){

this.message=

err.response?.data?.error||

"Withdrawal failed.";

this.isError=true;

}

finally{

this.withdrawing=false;

}

},

resetForm(){

this.amount="";

this.bankSearch="";

this.accountNumber="";

this.accountName="";

this.selectedBank=null;

this.filteredBanks=this.banks;

},

navigateToTransaction(){

this.$router.push(

`/transaction/${this.userId}`

);

}

}

};
</script>

<style scoped>

.withdrawal-container{

    max-width:650px;

    margin:40px auto;

    padding:30px;

    background:lightyellow;

    border-radius:10px;

    box-shadow:0 2px 12px rgba(0,0,0,.12);

}

h2{

    text-align:center;

    margin-bottom:25px;

    color:#1b5e20;

}

.transaction-button-container{

    display:flex;

    justify-content:flex-end;

    margin-bottom:20px;

}

.button{

    border:none;

    cursor:pointer;

    border-radius:5px;

    padding:10px 18px;

    font-size:14px;

    transition:.3s;

}

.transaction{

    background:#0d6efd;

    color:white;

}

.transaction:hover{

    background:#0b5ed7;

}

.form-group{

    margin-bottom:20px;

    position:relative;

}

label{

    display:block;

    margin-bottom:8px;

    font-weight:600;

    color:#444;

}

input{

    width:100%;

    box-sizing:border-box;

    padding:12px;

    border:1px solid #ccc;

    border-radius:6px;

    outline:none;

    font-size:15px;

}

input:focus{

    border-color:#198754;

    box-shadow:0 0 4px rgba(25,135,84,.3);

}

.autocomplete{

    position:relative;

}

.suggestions{

    position:absolute;

    top:100%;

    left:0;

    right:0;

    background:white;

    border:1px solid #ddd;

    border-top:none;

    max-height:250px;

    overflow-y:auto;

    z-index:999;

    box-shadow:0 3px 10px rgba(0,0,0,.12);

}

.suggestion{

    padding:12px;

    cursor:pointer;

    transition:.2s;

}

.suggestion:hover{

    background:#f5f5f5;

}

.resolve-btn{

    width:100%;

    padding:12px;

    background:#0d6efd;

    color:white;

    border:none;

    border-radius:6px;

    cursor:pointer;

    font-size:15px;

    margin-top:5px;

    transition:.3s;

}

.resolve-btn:hover:not(:disabled){

    background:#0b5ed7;

}

.resolve-btn:disabled{

    background:#c8c8c8;

    cursor:not-allowed;

}

.resolved-box{

    margin-top:18px;

    padding:15px;

    border-radius:6px;

    background:#e9f9ef;

    border:1px solid #b7e4c7;

    color:#155724;

}

.success{

    font-weight:bold;

    margin-bottom:6px;

}

.withdraw-btn{

    width:100%;

    margin-top:20px;

    padding:14px;

    border:none;

    border-radius:6px;

    background:#198754;

    color:white;

    font-size:16px;

    cursor:pointer;

    transition:.3s;

}

.withdraw-btn:hover:not(:disabled){

    background:#157347;

}

.withdraw-btn:disabled{

    background:#c8c8c8;

    cursor:not-allowed;

}

.message{

    margin-top:20px;

    padding:12px;

    border-radius:6px;

    background:#d1e7dd;

    color:#0f5132;

    border:1px solid #badbcc;

    word-break:break-word;

}

.message.error{

    background:#f8d7da;

    color:#842029;

    border:1px solid #f5c2c7;

}

.error{

    color:#dc3545;

    font-size:13px;

}

@media(max-width:768px){

.withdrawal-container{

    width:95%;

    padding:20px;

}

.transaction-button-container{

    justify-content:center;

}

.button{

    width:100%;

}

}

</style>
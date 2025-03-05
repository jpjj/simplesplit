// App.js - Complete code for the expense sharing app

import React, { useState, useEffect } from 'react';
import { Save, Upload, UserPlus, DollarSign, Trash2 } from 'lucide-react';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newUser, setNewUser] = useState('');
  const [expenseData, setExpenseData] = useState({
    paidBy: '',
    amount: '',
    description: '',
    splitWith: []
  });
  const [balances, setBalances] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Calculate balances whenever users or expenses change
  useEffect(() => {
    calculateBalances();
  }, [users, expenses]);

  // Add a new user
  const addUser = () => {
    if (newUser.trim() && !users.includes(newUser.trim())) {
      setUsers([...users, newUser.trim()]);
      setNewUser('');
    }
  };

  // Remove a user
  const removeUser = (userToRemove) => {
    setUsers(users.filter(user => user !== userToRemove));
    
    // Remove expenses paid by or involving this user
    setExpenses(expenses.filter(expense => {
      return expense.paidBy !== userToRemove && 
             !expense.splitWith.includes(userToRemove);
    }));
  };

  // Toggle user selection for splitting an expense
  const toggleUserForSplit = (user) => {
    if (expenseData.splitWith.includes(user)) {
      setExpenseData({
        ...expenseData,
        splitWith: expenseData.splitWith.filter(u => u !== user)
      });
    } else {
      setExpenseData({
        ...expenseData,
        splitWith: [...expenseData.splitWith, user]
      });
    }
  };

  // Add a new expense
  const addExpense = () => {
    // Reset previous errors
    const errors = {};
    
    // Validate form fields
    if (!expenseData.paidBy) {
      errors.paidBy = "Please select who paid";
    }
    
    if (!expenseData.amount) {
      errors.amount = "Please enter an amount";
    } else if (isNaN(parseFloat(expenseData.amount))) {
      errors.amount = "Please enter a valid number";
    }
    
    if (!expenseData.description) {
      errors.description = "Please enter a description";
    }
    
    if (expenseData.splitWith.length === 0) {
      errors.splitWith = "Please select at least one person to split with";
    }
    
    // Update error state
    setFormErrors(errors);
    
    // If no errors, add the expense
    if (Object.keys(errors).length === 0) {
      const newExpense = {
        id: Date.now(),
        ...expenseData,
        amount: parseFloat(expenseData.amount)
      };
      
      setExpenses([...expenses, newExpense]);
      
      // Reset form
      setExpenseData({
        paidBy: '',
        amount: '',
        description: '',
        splitWith: []
      });
      
      // Clear any previous errors
      setFormErrors({});
    }
  };

  // Remove an expense
  const removeExpense = (expenseId) => {
    setExpenses(expenses.filter(expense => expense.id !== expenseId));
  };

  // Calculate balances between users
  const calculateBalances = () => {
    const newBalances = {};
    
    // Initialize balances for all users
    users.forEach(user => {
      newBalances[user] = {};
      users.forEach(otherUser => {
        if (user !== otherUser) {
          newBalances[user][otherUser] = 0;
        }
      });
    });
    
    // Calculate balances based on expenses
    expenses.forEach(expense => {
      const { paidBy, amount, splitWith } = expense;
      const splitAmount = amount / splitWith.length;
      
      splitWith.forEach(user => {
        if (user !== paidBy) {
          newBalances[user][paidBy] -= splitAmount;
          newBalances[paidBy][user] += splitAmount;
        }
      });
    });
    
    // Simplify balances (combine reciprocal debts)
    users.forEach(user => {
      users.forEach(otherUser => {
        if (user !== otherUser) {
          if (newBalances[user][otherUser] > 0 && newBalances[otherUser][user] > 0) {
            if (newBalances[user][otherUser] > newBalances[otherUser][user]) {
              newBalances[user][otherUser] -= newBalances[otherUser][user];
              newBalances[otherUser][user] = 0;
            } else {
              newBalances[otherUser][user] -= newBalances[user][otherUser];
              newBalances[user][otherUser] = 0;
            }
          }
        }
      });
    });
    
    setBalances(newBalances);
  };

  // Save current state to a JSON file
  const saveState = () => {
    const state = {
      users,
      expenses
    };
    
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expense-sharing-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load state from a JSON file
  const loadState = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const state = JSON.parse(e.target.result);
          if (state.users && state.expenses) {
            setUsers(state.users);
            setExpenses(state.expenses);
          }
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Expense Sharing App</h1>
      
      {/* Users Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">People</h2>
        
        <div className="flex mb-4">
          <input
            type="text"
            className="flex-grow px-4 py-2 border rounded-l-lg focus:outline-none"
            placeholder="Add a person"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addUser()}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
            onClick={addUser}
          >
            <UserPlus size={20} />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {users.map(user => (
            <div key={user} className="flex items-center bg-blue-100 px-3 py-1 rounded-full">
              <span>{user}</span>
              <button
                className="ml-2 text-red-500 hover:text-red-700"
                onClick={() => removeUser(user)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Expense Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium">Paid By</label>
            <select
              className={`w-full px-4 py-2 border rounded-lg ${formErrors.paidBy ? 'border-red-500' : ''}`}
              value={expenseData.paidBy}
              onChange={(e) => setExpenseData({...expenseData, paidBy: e.target.value})}
            >
              <option value="">Select Person</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
            {formErrors.paidBy && <p className="text-red-500 text-sm mt-1">{formErrors.paidBy}</p>}
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <DollarSign size={16} className="text-gray-500" />
              </div>
              <input
                type="number"
                className={`w-full pl-10 px-4 py-2 border rounded-lg ${formErrors.amount ? 'border-red-500' : ''}`}
                placeholder="Amount (can be negative)"
                value={expenseData.amount}
                onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
              />
            </div>
            {formErrors.amount && <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Description</label>
          <input
            type="text"
            className={`w-full px-4 py-2 border rounded-lg ${formErrors.description ? 'border-red-500' : ''}`}
            placeholder="What was this expense for?"
            value={expenseData.description}
            onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
          />
          {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block mb-1 font-medium">Split With</label>
          <div className={`flex flex-wrap gap-2 ${formErrors.splitWith ? 'p-2 border border-red-500 rounded-lg' : ''}`}>
            {users.map(user => (
              <div
                key={user}
                className={`cursor-pointer px-3 py-1 rounded-full ${
                  expenseData.splitWith.includes(user) 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => toggleUserForSplit(user)}
              >
                {user}
              </div>
            ))}
          </div>
          {formErrors.splitWith && <p className="text-red-500 text-sm mt-1">{formErrors.splitWith}</p>}
        </div>
        
        <button
          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
          onClick={addExpense}
          type="button"
        >
          Add Expense
        </button>
        
        {Object.keys(formErrors).length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-700 font-medium">Please correct the errors above to add this expense.</p>
          </div>
        )}
      </div>
      
      {/* Expenses List */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Expenses</h2>
        
        {expenses.length === 0 ? (
          <p className="text-gray-500 text-center">No expenses added yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left">Paid By</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Split With</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id} className="border-b">
                    <td className="px-4 py-2">{expense.paidBy}</td>
                    <td className={`px-4 py-2 ${expense.amount < 0 ? 'text-red-500' : ''}`}>
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-2">{expense.description}</td>
                    <td className="px-4 py-2">{expense.splitWith.join(', ')}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => removeExpense(expense.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Balances Section */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Balances</h2>
        
        {users.length < 2 ? (
          <p className="text-gray-500 text-center">Add at least two people to see balances.</p>
        ) : expenses.length === 0 ? (
          <p className="text-gray-500 text-center">Add some expenses to see balances.</p>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              Object.entries(balances[user] || {}).map(([otherUser, amount]) => {
                if (amount > 0) {
                  return (
                    <div key={`${user}-${otherUser}`} className="p-2 bg-white rounded border">
                      <span className="font-medium">{otherUser}</span> owes <span className="font-medium">{user}</span> <span className="text-green-600 font-medium">${amount.toFixed(2)}</span>
                    </div>
                  );
                }
                return null;
              })
            ))}
            {Object.values(balances).every(userBalances => 
              Object.values(userBalances).every(amount => amount === 0)
            ) && (
              <p className="text-gray-500 text-center">Everyone is settled up!</p>
            )}
          </div>
        )}
      </div>
      
      {/* Save/Load Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
          onClick={saveState}
        >
          <Save size={20} className="mr-2" />
          Save Data
        </button>
        
        <label className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center justify-center cursor-pointer">
          <Upload size={20} className="mr-2" />
          Load Data
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={loadState}
          />
        </label>
      </div>
    </div>
  );
}

export default App;
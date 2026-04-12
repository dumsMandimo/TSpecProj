import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import './loginPage.css';


export default function loginPage() {

  return (
    <main className="login-page">

      <section className="login-right">
        <h2>Login to your account</h2>

        <section
          role="tabpanel"
          aria-label={`${activeRole} signup form`}
          className="form-panel"
        >
          {forms[activeRole]}
        </section>

        <p className="login-prompt">
          Don't have an account? <a href="/login">Sign up here</a>
        </p>
      </section>

    </main>
  );
}
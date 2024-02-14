'use client'
import Button from "@/components/ui/button"
import { signOut } from "next-auth/react";

const page = () =>{
    return<Button onClick={()=>signOut()}>Signout</Button>
}

export default page;
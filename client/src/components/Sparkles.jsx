import { motion } from "framer-motion";

export default function Sparkles(){

return(

<>

{Array.from({length:30}).map((_,i)=>(

<motion.div

key={i}

animate={{

opacity:[0,1,0],

scale:[0.5,1.3,0.5]

}}

transition={{

repeat:Infinity,

duration:2+Math.random()*2,

delay:Math.random()*4

}}

style={{

left:`${Math.random()*100}%`,

top:`${Math.random()*100}%`

}}

className="

absolute

w-1

h-1

rounded-full

bg-cyan-300

"

/>

))}

</>

)

}
import {
  User,
  Mail,
  Lock,
  Building
} from "lucide-react";

export default function RegisterForm() {
  return (
    <div className="p-10 h-full">

      <h2 className="text-4xl font-bold text-white mb-8">
        Create Account
      </h2>

      <div className="space-y-6">

        <Input icon={<User size={18}/>} placeholder="Full Name" />

        <Input icon={<Mail size={18}/>} placeholder="Email" />

        <Input icon={<Lock size={18}/>} placeholder="Password" type="password" />

        <Input icon={<Building size={18}/>} placeholder="College" />

        <div className="grid grid-cols-2 gap-5">

          <select className="glassInput">
            <option>Branch</option>
          </select>

          <select className="glassInput">
            <option>Year</option>
          </select>

        </div>

        <button className="registerButton">
          Register Now →
        </button>

      </div>

    </div>
  );
}

function Input({
  icon,
  placeholder,
  type="text"
}) {
  return (
    <div className="relative">

      <div className="absolute left-5 top-4 text-purple-300">
        {icon}
      </div>

      <input
        type={type}
        placeholder={placeholder}
        className="glassInput pl-14"
      />

    </div>
  );
}
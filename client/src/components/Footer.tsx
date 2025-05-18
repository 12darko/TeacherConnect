import { Link } from "wouter";
import { FacebookIcon, TwitterIcon, InstagramIcon, YoutubeIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-white pt-12 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="material-icons text-white text-3xl">school</span>
              <span className="ml-2 text-xl font-heading font-semibold">EduConnect</span>
            </div>
            <p className="text-neutral-light mb-4">
              Connecting students with expert teachers for personalized online learning experiences.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-blue-300 transition">
                <FacebookIcon size={20} />
              </a>
              <a href="#" className="text-white hover:text-blue-300 transition">
                <TwitterIcon size={20} />
              </a>
              <a href="#" className="text-white hover:text-blue-300 transition">
                <InstagramIcon size={20} />
              </a>
              <a href="#" className="text-white hover:text-blue-300 transition">
                <YoutubeIcon size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-medium mb-4">For Students</h3>
            <ul className="space-y-2">
              <li><Link href="/find-teachers" className="text-neutral-light hover:text-white transition">Find Teachers</Link></li>
              <li><Link href="/student-dashboard" className="text-neutral-light hover:text-white transition">Book a Class</Link></li>
              <li><Link href="/student-dashboard?tab=assignments" className="text-neutral-light hover:text-white transition">View Assignments</Link></li>
              <li><Link href="/student-dashboard?tab=progress" className="text-neutral-light hover:text-white transition">Track Progress</Link></li>
              <li><a href="#" className="text-neutral-light hover:text-white transition">Subscription Plans</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-medium mb-4">For Teachers</h3>
            <ul className="space-y-2">
              <li><Link href="/register" className="text-neutral-light hover:text-white transition">How to Join</Link></li>
              <li><Link href="/teacher-dashboard?tab=profile" className="text-neutral-light hover:text-white transition">Create Your Profile</Link></li>
              <li><Link href="/teacher-dashboard?tab=availability" className="text-neutral-light hover:text-white transition">Set Teaching Hours</Link></li>
              <li><a href="#" className="text-neutral-light hover:text-white transition">Payment Information</a></li>
              <li><a href="#" className="text-neutral-light hover:text-white transition">Teaching Resources</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-heading font-medium mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-light hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="text-neutral-light hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="text-neutral-light hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-light hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="text-neutral-light hover:text-white transition">About Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-gray-600 text-center text-neutral-light text-sm">
          <p>&copy; {new Date().getFullYear()} EduConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'zobayoussef@gmail.com',
            pass: 'bkvlnsjoshhnrewf',
        },
        tls: {
            rejectUnauthorized: false,
        },
    });
    
    // 2)- define email options 
    const mailOptions = {
        from: '"TraveLux" <zobayoussef@gmail.com>',
        to:options.email,
        subject:options.subject,
        html: `<body class="bg-gray-100 font-sans">
    <div class="max-w-2xl mx-auto my-10 bg-white rounded-lg shadow-md overflow-hidden">
        <!-- Header -->
        <div class="bg-purple-600 py-4 px-6">
            <h1 class="text-2xl font-bold text-white">${options.subject}</h1>
        </div>
        
        <!-- Content -->
        <div class="p-6">
            <h2 class="text-xl font-semibold text-gray-800 mb-4">${options.subject}</h2>
            <p class="text-gray-600 mb-6">We received a request to "${options.subject}". 
            Please use the following code to proceed:</p>
            
            <!-- Reset Code Box -->
            <div class="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 text-center">
                <span class="text-3xl font-bold text-purple-600 tracking-wider">${options.message}</span>
            </div>
            
            <p class="text-gray-600 mb-6">This code is valid for <span class="font-semibold">10 minutes</span> only.</p>
            
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <p class="text-yellow-700">For security reasons, please don't share this code with anyone.</p>
            </div>
            
            <div class="border-t border-gray-200 pt-4">
                <p class="text-sm text-gray-500">If you didn't request a password reset, please secure your account.</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="bg-gray-50 px-6 py-4 text-center">
            <p class="text-sm text-gray-500">© 2025 TraveLux. All rights reserved.</p>
        </div>
    </div>
</body>

        `
    }
    // 3)- send email
    await transporter.sendMail(mailOptions);
    
}




module.exports = sendEmail;
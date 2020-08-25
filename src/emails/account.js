const sgMail=require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail=(email,name)=>{
    sgMail.send({
        to:email,
        from:'vansh.100.2020@doonschool.com',
        subject:'Thanks for joining us!',
        text:`Welcome to the app, ${name}. Let me know how you get along with the app`
    })
}

const sendCancelationEmail=(email,name)=>{
    sgMail.send({
        to:email,
        from:'vansh.100.2020@doonschool.com',
        subject:'Sorry to see you go!',
        text:`Bye, ${name}. Is there anything that we could have done better?`
    })
}

module.exports={
    sendWelcomeEmail,
    sendCancelationEmail
}
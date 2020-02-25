const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//@route  POST api/users
//@desc   register user
//@access Public
router.post(
  '/',
  [
  check('name','Name is required')
    .not()
    .isEmpty(),
  check('email','Please insert a valid email').isEmail(),
  check(
    'password',
    'Please input password with 6 or more charracters'
  ).isLength({ min: 6 })  
],
async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const { name,email,password } = req.body;

  try {
    // see if user exists

    let user = await User.findOne({ email });
    if(user) {
      return res
        .status(400)
        .json({ errors: [{ msg: 'user already registered' }] });
    }
    //Get the gravater

    const avatar = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'nm'
    });
    // const avatar = 'avatar'

    user = new User({
      name,
      email,
      avatar,
      password
    });

    //encrypt password

    const salt = await bcrypt.genSalt(10);

    user.password = await bcrypt.hash(password,salt);

    await user.save();


    //return jsonWebToken
    
    const payload = {
      user: {
        id: user.id
      }
    }

    jwt.sign(
      payload, 
      config.get('jwtSecret'),
      { expiresIn: 360000 },
      (err, token) => {
        if(err) throw err;
        res.json({ token });
      });

  }catch(err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
  


  
});

module.exports = router;

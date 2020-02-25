const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const request = require('request');
const config = require('config');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check,validationResult } = require('express-validator');

//@route  GET api/profile/me
//@desc   GET current users profile
//@access Private
router.get('/me',auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user',
    ['name','avatar']);

    if(!profile) {
      return res.status(400).json({ msg: 'There is no profile of the user' });
    }

    res.json(profile);

  }catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error...');
  }
});

//@route  POST api/profile/me
//@desc   Create or update user profile 
//@access Private

router.post('/',[ auth,[
    check('status','Status is required')
      .not()
      .isEmpty(),
    check('skills','Skills is required')
      .not()
      .isEmpty()  
  ]
],
async (req,res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }


  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkdin
  } = req.body;

  //Build profile Object

  const profileFields = {};
  profileFields.user = req.user.id;
  if(company) profileFields.company = company;
  if(website) profileFields.website = website;
  if(location) profileFields.location = location;
  if(bio) profileFields.bio = bio;
  if(status) profileFields.status = status;
  if(githubusername) profileFields.githubusername = githubusername;
  
  if(skills) {
    profileFields.skills = skills.split(',').map(skill => skill.trim()); 
  }

  //Build social objects

  profileFields.social = {};
  if(youtube) profileFields.social.youtube = youtube;
  if(facebook) profileFields.social.facebook = facebook;
  if(twitter) profileFields.social.twitter = twitter;
  if(instagram) profileFields.social.instagram = instagram;
  if(linkdin) profileFields.social.linkdin = linkdin;



  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if(profile) {
      //Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );

      return res.json(profile);
    }

    //Create
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);

  }catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }

  res.send('hello');

});

//@route  GET api/profile/
//@desc   GET all profiles
//@access Public

router.get(
  '/',
  async (req,res) => {
    try {
      const profiles = await Profile.find().populate('user',['name','avatar','email']);
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(400).send('Server Error');
    }
  });

//@route  GET api/profile/user/:user_id
//@desc   GET profile by user_id
//@access Public

router.get(
  '/user/:user_id',
  async (req,res) => {
    try {
      const profile = await Profile.findOne({ user: req.params.user_id }).populate('user',['name','avatar']);
        

      if(!profile) return res.status(400).json(
        {
          msg: 'Profile not found'
        }
      );
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      if(err.kind == 'ObjectId') {
        return res.status(400).json(
          { 
            msg: 'Profile not found' 
          });
      }
      res.status(500).send('Server Error...');
    }
  });

  //@route  DELETE api/profile/
  //@desc   Delete profile, user & posts
  //@access Private

  router.delete(
    '/',
    auth,
    async (req,res) => {
      try {
        //delete profile
        await Profile.findOneAndDelete({ user: req.user.id });
        //delete user
        await User.findOneAndDelete({ _id: req.user.id });
        res.json({ msg: 'User deleted' });
      } catch (err) {
        console.error(err.message);
        return res.status(400).json({ msg: 'invalid query' });
      }
    }

  );

  //@route  PUT api/profile/experience
  //@desc   Add profile experience
  //@access Public
  router.put(
    '/experience',
    [ auth, [
      check('title','Title is required')
        .not()
        .isEmpty(),
      check('company','Company is required')
        .not()
        .isEmpty(),
      check('from','From Date is required')
        .not()
        .isEmpty(),
      check('to','To Date is required')
        .not()
        .isEmpty()      
    ]],
    async (req,res) => {
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      } = req.body;

      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      }

      try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp);
        await profile.save()
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(400).json({ msg: 'Invalid Query' });
      }
    }
  );

  //@route  PUT api/profile/education
  //@desc   Add profile education
  //@access Public

  router.put(
    '/education',
    [ auth, [
      check('school','School is required')
        .not()
        .isEmpty(),
      check('degree','Degree is required')
        .not()
        .isEmpty(),
      check('fieldofstudy','Field of study is required')
        .not()
        .isEmpty(),
      check('from','From Date is required')
        .not()
        .isEmpty(),
      check('to','To Date is required')
        .not()
        .isEmpty()    
    ]],
    async (req,res) => {
      const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      } = req.body;

      const newEd = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      };

      try {
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEd);
        await profile.save();
        res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(400).send('Server Error');
      }
    }
  );

  //@route  DELETE api/profile/experience
  //@desc   Delete experience
  //@access Private  

  router.delete(
    '/experience/:exp_id',
    auth,
    async (req,res) => {
      try {
        const profile = await Profile.findOne({user: req.user.id });
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);
          // if(removeIndex != 0) {
          //   profile.experience.splice(removeIndex, 1);
          //   console.log(profile.experience['_id']);
          // }
          // const ids = profile.experience.find(expr => profile.experience.title === 'VIF Admin' );
          // console.log(profile.experience[1].title);
          
          for(let i=0;i<profile.experience.length;i++) {
            if(profile.experience[i].id === req.params.exp_id) {
              console.log(profile.experience[i]._id);
              profile.experience.splice(removeIndex, 1);
            }
            
          }
          
          await profile.save();
          res.json(profile); 
      } catch (err) {
        console.error(err.message);
        return res.status(400).send('Server error');
      }
    }
  );

  //@route  DELETE api/profile/education
  //@desc   Delete education
  //@access Private 

  router.delete(
    '/education/:edu_id',
    auth,
    async (req,res) => {
      try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);
          for(let i=0;i<profile.education.length;i++) {
            if(profile.education[i].id === req.params.edu_id) {
              console.log(profile.education[i].id);
              profile.education.splice(removeIndex,1);
              
            }
          }
          profile.save();
          res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(400).send('Server Error');
      }
    }
  );
  
  //@route  GET api/profile/github/:username
  //@desc   get github repos
  //@access Public
  
  router.get(
    '/github/:username',
    (req,res) => {
      try {
        const options = {
          uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
          sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=
          ${config.get('githubSecret')}`,
          method: 'GET',
          headers: { 'user-agent': 'node.js'}
        };

        request(options, (error,response,body) => {
          if(error) console.error(error);
          if(response.statusCode !== 200) {
            return res.status(404).json({ msg: 'No github profile found' });
          }

          res.json(JSON.parse(body));
        });
      } catch (err) {
        console.error(err.message);
        return res.status(400).send('Server Error');
      }
    }
  );

module.exports = router;

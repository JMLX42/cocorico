import config from './config';

var firstnames = [
  'Jacob', 'Emily', 'Michael', 'Madison', 'Joshua', 'Hannah', 'Matthew',
  'Emma', 'Andrew', 'Ashley', 'Christopher', 'Abigail', 'Joseph', 'Alexis',
  'Daniel', 'Olivia', 'Nicholas', 'Samantha', 'Ethan', 'Sarah', 'William',
  'Elizabeth', 'Anthony', 'Alyssa', 'Ryan', 'Grace', 'David', 'Isabella',
  'Tyler', 'Lauren', 'John', 'Jessica', 'Alexander', 'Taylor', 'James',
  'Brianna', 'Brandon', 'Kayla', 'Zachary', 'Anna', 'Jonathan', 'Victoria',
  'Dylan', 'Sophia', 'Christian', 'Natalie', 'Samuel', 'Sydney', 'Justin',
  'Chloe', 'Benjamin', 'Megan', 'Nathan', 'Jasmine', 'Austin', 'Rachel',
  'Noah', 'Hailey', 'Logan', 'Morgan', 'Jose', 'Destiny', 'Kevin',
  'Julia', 'Robert', 'Jennifer', 'Gabriel', 'Kaitlyn', 'Thomas', 'Katherine',
  'Caleb', 'Haley', 'Jordan', 'Alexandra', 'Hunter', 'Nicole', 'Cameron',
  'Mia', 'Elijah', 'Savannah', 'Jason', 'Maria', 'Kyle', 'Ava',
  'Jack', 'Mackenzie', 'Connor', 'Allison', 'Aaron', 'Amanda', 'Isaiah',
  'Stephanie', 'Luke', 'Brooke', 'Evan', 'Makayla', 'Angel', 'Jenna',
  'Isaac', 'Faith',
];

var id = 0;

export default function() {
  return {
    iss: config.testApp.id,
    sub: ++id,
    firstName: firstnames[Math.floor(Math.random() * firstnames.length)],
    lastName: firstnames[Math.floor(Math.random() * firstnames.length)],
    birthdate: Math.floor(Math.random() * 27)
      + '/' + Math.ceil(Math.random() * 12)
      + '/' + (1940 + Math.floor(Math.random() * 75)),
    gender: ['male', 'female'][Math.floor(Math.random() * 2)],
  };
}

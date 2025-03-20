class User < ApplicationRecord
  has_secure_password

  validates :email, presence: true, uniqueness: true
  validates :nickname, presence: true, uniqueness: true
  validates :password, length: { minimum: 6 }

  def self.authenticate(email, password)
    user = User.find_by(email: email)
    return user if user && user.authenticate(password)
    nil
  end
end

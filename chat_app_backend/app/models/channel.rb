class Channel < ApplicationRecord
  has_many :subscriptions, dependent: :destroy
  has_many :users, through: :subscriptions
  has_many :messages, dependent: :destroy

  validates :name, presence: true
end

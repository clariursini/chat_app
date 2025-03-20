class Message < ApplicationRecord
  belongs_to :user
  belongs_to :channel, optional: true
  belongs_to :direct_recipient, class_name: 'User', optional: true

  validates :content, presence: true
  validate :channel_or_direct_recipient

  private

  def channel_or_direct_recipient
    if channel_id.nil? && direct_recipient_id.nil?
      errors.add(:base, 'Message must belong to a channel or have a direct recipient')
    end
  end
end

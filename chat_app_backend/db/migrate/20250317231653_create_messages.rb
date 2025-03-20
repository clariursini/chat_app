class CreateMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :messages do |t|
      t.text :content, null: false
      t.references :user, null: false, foreign_key: true
      t.references :channel, null: true, foreign_key: true
      t.references :direct_recipient, null: true, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end

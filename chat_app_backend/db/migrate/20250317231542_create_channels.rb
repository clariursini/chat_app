class CreateChannels < ActiveRecord::Migration[7.1]
  def change
    create_table :channels do |t|
      t.string :name, null: false
      t.text :description
      t.boolean :public, default: true

      t.timestamps
    end
  end
end

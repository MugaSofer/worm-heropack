function init(hero) {
    hero.addPrimaryEquipment('fiskheroes:superhero_chestplate{HeroType:worm:parian_spare}', true);
}

function tick(entity, manager) {
    if (entity.ticksExisted() % 40 != 0) return;
    var nbt = entity.getWornChestplate().nbt();
    if (nbt.getTagList("Equipment").tagCount() == 0) {
        manager.setTagList(nbt, "Equipment", manager.newTagList('[{Index:0,Item:{Count:1,Damage:0,id:4097,tag:{HeroType:"worm:parian_spare"}}}]'));
    }
}
